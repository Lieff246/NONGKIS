import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/users'
import Place from '#models/place'

export default class BookingsController {
  async index({ response }: HttpContext) {
    try {
      // Get all bookings with populated place data (untuk admin)
      let bookings = await Booking.find().populate('place').populate('owner', 'name email')
      
      // Add default status to bookings that don't have it (for display only)
      bookings = bookings.map(booking => {
        const bookingObj = booking.toObject()
        if (!bookingObj.status) {
          bookingObj.status = 'pending'
        }
        return bookingObj
      })

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
    console.log('\n=== UPDATE STATUS REQUEST ===')
    console.log('Booking ID:', params.id)
    console.log('Request method:', request.method())
    console.log('Request URL:', request.url())
    
    try {
      const requestBody = request.body()
      console.log('Request body:', requestBody)
      
      const { status } = request.only(['status'])
      console.log('Extracted status:', status)
      
      if (!status) {
        console.log('❌ No status provided')
        return response.badRequest({ message: 'Status is required' })
      }
      
      console.log('Finding booking with ID:', params.id)
      const existingBooking = await Booking.findById(params.id)
      console.log('Existing booking before update:', existingBooking)
      
      console.log('Updating booking...')
      const booking = await Booking.findByIdAndUpdate(
        params.id,
        { status },
        { new: true }
      )
      
      console.log('Updated booking result:', booking)
      
      if (!booking) {
        console.log('❌ Booking not found after update')
        return response.notFound({ message: 'Booking not found' })
      }
      
      // Double check by fetching again
      const verifyBooking = await Booking.findById(params.id)
      console.log('Final verification:', verifyBooking)
      
      console.log('✅ Update completed successfully')
      console.log('=== END UPDATE REQUEST ===\n')
      
      return response.ok({
        message: 'Booking status updated successfully',
        booking: verifyBooking
      })
    } catch (error) {
      console.error('❌ Update status error:', error)
      console.log('=== ERROR END ===\n')
      return response.internalServerError({
        message: 'Failed to update booking status',
        error: error.message
      })
    }
  }

  async destroy({ params, request, response }: HttpContext) {
    try {
      console.log('🗑️ Delete booking request:', params.id)
      
      // Check if booking exists
      const booking = await Booking.findById(params.id)
      
      if (!booking) {
        console.log('❌ Booking not found:', params.id)
        return response.notFound({
          message: 'Booking not found'
        })
      }
      
      console.log('✅ Booking found, deleting...', booking._id)
      
      // Delete the booking
      await Booking.findByIdAndDelete(params.id)
      
      console.log('✅ Booking deleted successfully')
      
      return response.ok({
        message: 'Booking deleted successfully',
      })
    } catch (error) {
      console.error('❌ Delete booking error:', error)
      return response.internalServerError({
        message: 'Failed to delete booking',
        error: error.message
      })
    }
  }
}
