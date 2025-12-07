import type { HttpContext } from '@adonisjs/core/http'
import Place from '#models/place'
import User from '#models/users'

export default class PlacesController {
  async index({ response }: HttpContext) {
    try {
      // Only show approved places for public
      const places = await Place.find({ status: 'approved' }).populate('owner_id', 'name email')
      return response.ok(places)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get places',
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const place = await Place.findById(params.id)

      if (!place) {
        return response.notFound({ message: 'Place not found' })
      }

      return response.ok(place)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get place',
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const data = request.only(['name', 'location', 'description', 'category', 'capacity', 'image', 'owner_id'])

      // Simple validation: check if owner_id exists and is actually an owner
      const owner = await User.findById(data.owner_id)
      if (!owner || owner.role !== 'owner') {
        return response.badRequest({ message: 'Invalid owner' })
      }

      // Auto-geocode location to get coordinates
      let coordinates = { lat: null, lng: null }
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location)}, Palu, Sulawesi Tengah&format=json&limit=1`
        const geocodeResponse = await fetch(geocodeUrl)
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.length > 0) {
          coordinates = {
            lat: parseFloat(geocodeData[0].lat),
            lng: parseFloat(geocodeData[0].lon)
          }
          console.log('📍 Geocoded:', data.location, '→', coordinates)
        }
      } catch (geocodeError) {
        console.log('⚠️ Geocoding failed, using null coordinates')
      }

      const place = await Place.create({
        ...data,
        coordinates,
        status: 'pending' // Always pending, need admin approval
      })

      return response.created({
        message: 'Place submitted for approval',
        place: place,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create place',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const body = request.body()
      const allData = request.all()
      const data = request.only(['name', 'location', 'description', 'category', 'capacity', 'image'])
      
      console.log('🔍 UPDATE PLACE - ID:', params.id)
      console.log('🔍 UPDATE PLACE - Content-Type:', request.header('content-type'))
      console.log('🔍 UPDATE PLACE - Raw body:', body)
      console.log('🔍 UPDATE PLACE - All data:', allData)
      console.log('🔍 UPDATE PLACE - Extracted data:', data)
      
      // Filter out empty/null values
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      )
      console.log('🔍 UPDATE PLACE - Filtered data:', filteredData)

      const place = await Place.findByIdAndUpdate(
        params.id,
        filteredData,
        { new: true } // return updated document
      )
      
      console.log('🔍 UPDATE PLACE - Updated place:', place)

      if (!place) {
        return response.notFound({ message: 'Place not found' })
      }

      return response.ok({
        message: 'Place updated successfully',
        place: place,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update place',
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const place = await Place.findByIdAndDelete(params.id)

      if (!place) {
        return response.notFound({ message: 'Place not found' })
      }

      return response.ok({
        message: 'Place deleted successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to delete place',
      })
    }
  }

  // Get pending places for admin approval
  async pending({ response }: HttpContext) {
    try {
      const places = await Place.find({ status: 'pending' }).populate('owner_id', 'name email')
      return response.ok(places)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get pending places',
      })
    }
  }

  // Get all places (for owner to see their places)
  async all({ response }: HttpContext) {
    try {
      const places = await Place.find().populate('owner_id', 'name email')
      console.log('🔍 All places from DB:', places.length)
      console.log('🔍 Sample place:', places[0])
      return response.ok(places)
    } catch (error) {
      console.error('❌ Error in all():', error)
      return response.internalServerError({
        message: 'Failed to get all places',
      })
    }
  }

  // Approve or reject place
  async approve({ params, request, response }: HttpContext) {
    try {
      const { status } = request.only(['status']) // 'approved' or 'rejected'
      
      const place = await Place.findByIdAndUpdate(
        params.id,
        { status },
        { new: true }
      ).populate('owner_id', 'name email')

      if (!place) {
        return response.notFound({ message: 'Place not found' })
      }

      return response.ok({
        message: `Place ${status} successfully`,
        place: place,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update place status',
      })
    }
  }
}
