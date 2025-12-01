import type { HttpContext } from '@adonisjs/core/http'
import Place from '#models/place'

export default class PlacesController {
  async index({ response }: HttpContext) {
    try {
      const places = await Place.find()
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
      const data = request.only(['name', 'location', 'description'])

      const place = await Place.create(data)

      return response.created({
        message: 'Place created successfully',
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
      const data = request.only(['name', 'location', 'description'])

      const place = await Place.findByIdAndUpdate(
        params.id,
        data,
        { new: true } // return updated document
      )

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
}
