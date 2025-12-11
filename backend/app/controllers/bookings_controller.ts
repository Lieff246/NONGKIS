import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/users'
import Place from '#models/place'

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

      const data = request.only(['placeId', 'customerName', 'customerEmail', 'capacity', 'date', 'time'])

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
      
      // Check if place is open
      const timeResponse = await fetch('http://localhost:3333/time/palu')
      const timeData = await timeResponse.json()
      const currentTime = timeData.timeString.split(':')[0] + ':' + timeData.timeString.split(':')[1]
      const openTime = place.openHours || '08:00'
      const closeTime = place.closeHours || '22:00'
      
      // Convert to minutes for proper comparison
      const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1])
      const openMinutes = parseInt(openTime.split(':')[0]) * 60 + parseInt(openTime.split(':')[1])
      const closeMinutes = parseInt(closeTime.split(':')[0]) * 60 + parseInt(closeTime.split(':')[1])
      
      let isOpen
      
      // Check for 24-hour operation
      if (openTime === '00:00' && closeTime === '23:59') {
        isOpen = true // Always open
      } else if (closeMinutes < openMinutes) {
        // Overnight operation
        isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes
      } else {
        // Normal operation
        isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      }
      
      if (!isOpen) {
        return response.badRequest({
          message: `Tempat sedang tutup. Buka: ${openTime} - ${closeTime}`
        })
      }

      // Validate capacity
      const capacity = parseInt(data.capacity) || 1
      if (capacity > (place.capacity || 10)) {
        return response.badRequest({
          message: `Kapasitas maksimal ${place.capacity || 10} orang`
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
        status: 'pending'
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
          status: booking.status
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
      
      const booking = await Booking.findByIdAndUpdate(
        params.id,
        { status },
        { new: true }
      )
      
      if (!booking) {
        return response.notFound({ message: 'Booking not found' })
      }
      
      return response.ok({
        message: 'Booking status updated successfully',
        booking: booking
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update booking status',
        error: error.message
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
        message: 'Failed to delete booking'
      })
    }
  }

}
