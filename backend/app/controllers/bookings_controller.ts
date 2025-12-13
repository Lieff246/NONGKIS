import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/users'
import Place from '#models/place'

// Interface for Time API response
interface TimeApiResponse {
  timeString: string
  dateString: string
  timezone: string
  message: string
  currentTime?: Date
}

export default class BookingsController {
  async index({ response }: HttpContext) {
    try {
      const bookings = await Booking.find().populate('place').populate('owner', 'name email')
      return response.ok(bookings)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get bookings',
      })
    }
  }

  async getOwnerBookings({ params, response }: HttpContext) {
    try {
      const { ownerId } = params

      // Get bookings for specific owner
      const bookings = await Booking.find({ owner: ownerId })
        .populate('place', 'name location')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })

      return response.ok(bookings)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get owner bookings',
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const userId = request.header('X-User-ID')

      if (!userId) {
        return response.unauthorized({
          message: 'User ID required. Please provide X-User-ID header',
        })
      }

      const data = request.only([
        'placeId',
        'customerName',
        'customerEmail',
        'capacity',
        'date',
        'time',
      ])

      // Check if user exists
      const user = await User.findById(userId)
      if (!user) {
        return response.notFound({ message: 'User not found' })
      }

      // Check if place exists
      const place = await Place.findById(data.placeId)
      if (!place) {
        return response.notFound({ message: 'Place not found' })
      }

      // Check if place is open using WorldTimeAPI (Direct Integration)
      let timeData: TimeApiResponse

      try {
        console.log('🌍 BookingController: Trying TimeAPI.io...')
        const apiResponse = await fetch('http://timeapi.io/api/Time/current/zone?timeZone=Asia/Makassar')

        if (apiResponse.ok) {
          const data = (await apiResponse.json()) as { dateTime: string }
          const dateTime = new Date(data.dateTime)

          timeData = {
            timeString: this.formatTime(dateTime),
            dateString: this.formatDate(dateTime),
            timezone: 'WITA (TimeAPI.io)',
            message: this.getTimeMessage(dateTime),
            currentTime: dateTime,
          }
          console.log('🌍 BookingController: TimeAPI.io SUCCESS')
        } else {
          throw new Error(`TimeAPI.io HTTP Error: ${apiResponse.status}`)
        }
      } catch (error) {
        console.log('⚠️ BookingController: TimeAPI.io failed, using fallback')

        // Fallback: use server time with WITA offset
        const now = new Date()
        const witaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)

        timeData = {
          timeString: this.formatTime(witaTime),
          dateString: this.formatDate(witaTime),
          timezone: 'WITA (Fallback)',
          message: this.getTimeMessage(witaTime),
          currentTime: witaTime,
        }
      }

      const currentTime =
        timeData.timeString.split(':')[0] + ':' + timeData.timeString.split(':')[1]

      const openTime = place.openHours || '08:00'
      const closeTime = place.closeHours || '22:00'

      console.log('🕐 Current Palu Time:', timeData.timeString)
      console.log('🕐 Current Time (HH:MM):', currentTime)
      console.log('🏪 Place Hours:', `${openTime} - ${closeTime}`)
      console.log('🌐 Timezone:', timeData.timezone)

      // Convert to minutes for proper comparison
      const currentMinutes =
        parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1])
      const openMinutes = parseInt(openTime.split(':')[0]) * 60 + parseInt(openTime.split(':')[1])
      const closeMinutes =
        parseInt(closeTime.split(':')[0]) * 60 + parseInt(closeTime.split(':')[1])

      console.log('🕢 Current Minutes:', currentMinutes)
      console.log('🔓 Open Minutes:', openMinutes)
      console.log('🔒 Close Minutes:', closeMinutes)

      let isOpen

      // Check for 24-hour operation
      if (openTime === '00:00' && closeTime === '23:59') {
        isOpen = true // Always open
        console.log('🌅 24-hour operation: ALWAYS OPEN')
      } else if (closeMinutes < openMinutes) {
        // Overnight operation (e.g., 15:00 - 06:00)
        isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes
        console.log('🌃 Overnight operation detected')
        console.log(
          '🔄 Is Open Logic: currentMinutes >= openMinutes OR currentMinutes <= closeMinutes'
        )
        console.log(
          `🔄 ${currentMinutes} >= ${openMinutes} OR ${currentMinutes} <= ${closeMinutes} = ${isOpen}`
        )
      } else {
        // Normal operation (e.g., 08:00 - 22:00)
        isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes
        console.log('☀️ Normal operation')
        console.log(
          '🔄 Is Open Logic: currentMinutes >= openMinutes AND currentMinutes <= closeMinutes'
        )
        console.log(
          `🔄 ${currentMinutes} >= ${openMinutes} AND ${currentMinutes} <= ${closeMinutes} = ${isOpen}`
        )
      }

      if (!isOpen) {
        return response.badRequest({
          message: `Tempat sedang tutup. Buka: ${openTime} - ${closeTime}`,
        })
      }

      // Validate capacity
      const capacity = parseInt(data.capacity) || 1
      if (capacity > (place.capacity || 10)) {
        return response.badRequest({
          message: `Kapasitas maksimal ${place.capacity || 10} orang`,
        })
      }

      // Create booking with complete data - langsung ke owner
      const booking = await Booking.create({
        user: userId,
        place: data.placeId,
        owner: place.owner_id, // Langsung ke owner
        customerName: data.customerName || user.name,
        customerEmail: data.customerEmail || user.email,
        capacity: capacity,
        date: data.date,
        time: data.time,
        status: 'pending',
      })

      return response.created({
        message: 'Booking berhasil dibuat! Menunggu konfirmasi owner.',
        booking: {
          id: booking._id,
          customerName: booking.customerName,
          placeName: place.name,
          placeLocation: place.location,
          capacity: booking.capacity,
          date: booking.date,
          time: booking.time,
          status: booking.status,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create booking',
      })
    }
  }

  async updateStatus({ params, request, response }: HttpContext) {
    try {
      const { status } = request.only(['status'])

      if (!status) {
        return response.badRequest({ message: 'Status is required' })
      }

      const booking = await Booking.findByIdAndUpdate(params.id, { status }, { new: true })

      if (!booking) {
        return response.notFound({ message: 'Booking not found' })
      }

      return response.ok({
        message: 'Booking status updated successfully',
        booking: booking,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update booking status',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const booking = await Booking.findByIdAndDelete(params.id)

      if (!booking) {
        return response.notFound({ message: 'Booking not found' })
      }

      return response.ok({ message: 'Booking deleted successfully' })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to delete booking',
      })
    }
  }

  // Helper methods for WorldTimeAPI integration (same as TimeController)
  private formatTime(date: Date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  private formatDate(date: Date) {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Makassar',
    })
  }

  private getTimeMessage(date: Date) {
    const hour = date.getHours()

    if (hour >= 5 && hour < 12) {
      return 'Selamat pagi! Waktu yang tepat untuk nongkrong pagi 🌅'
    } else if (hour >= 12 && hour < 15) {
      return 'Selamat siang! Perfect untuk lunch break ☀️'
    } else if (hour >= 15 && hour < 18) {
      return 'Selamat sore! Waktu nongkrong santai 🌇'
    } else if (hour >= 18 && hour < 22) {
      return 'Selamat malam! Waktu hangout bareng teman 🌙'
    } else {
      return 'Malam yang tenang, cocok untuk tempat yang cozy 🌃'
    }
  }
}
