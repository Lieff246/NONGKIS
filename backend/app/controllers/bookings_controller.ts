import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/users'
import Place from '#models/place'

export default class BookingsController {
  async index({ response }: HttpContext) {
    try {
      // Get all bookings with populated place data
      const bookings = await Booking.find().populate('place')

      return response.ok(bookings)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get bookings',
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

      const data = request.only(['placeId', 'date', 'time'])

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

      // Create booking
      const booking = await Booking.create({
        user: userId,
        place: data.placeId,
        customerName: user.name,
        customerEmail: user.email,
        date: data.date,
        time: data.time,
      })

      return response.created({
        message: 'Booking created successfully',
        booking: {
          id: booking._id,
          userName: user.name,
          placeName: place.name,
          placeLocation: place.location,
          date: booking.date,
          time: booking.time,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create booking',
      })
    }
  }

  async destroy({ params, request, response }: HttpContext) {
    try {
      const userId = request.header('X-User-ID')

      if (!userId) {
        return response.unauthorized({
          message: 'User ID required. Please provide X-User-ID header',
        })
      }

      // Find booking and check if it belongs to user
      const booking = await Booking.findOne({
        _id: params.id,
        user: userId,
      })

      if (!booking) {
        return response.notFound({
          message: 'Booking not found or you do not have permission to delete it',
        })
      }

      await Booking.findByIdAndDelete(params.id)

      return response.ok({
        message: 'Booking deleted successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to delete booking',
      })
    }
  }
}
