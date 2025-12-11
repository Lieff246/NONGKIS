import type { HttpContext } from '@adonisjs/core/http'
import Place from '#models/place'
import User from '#models/users'

export default class PlacesController {
  async index({ response }: HttpContext) {
    try {
      // 1. Ambil data tempat yang sudah diapprove
      const places = await Place.find({ status: 'approved' }).populate('owner_id', 'name email')

      // 2. Cek waktu sekarang (Panggil API WorldTime atau Fallback)
      const currentHour = await this.getCurrentTime()
      console.log('🕐 JAM SEKARANG (WITA):', currentHour)

      // 3. Proses status BUKA/TUTUP untuk setiap tempat
      const placesWithStatus = places.map((place) => {
        const placeObj = place.toObject()

        // Hitung apakah sedang buka
        const isOpen = this.calculateOpenStatus(
          currentHour,
          placeObj.openHours || '08:00',
          placeObj.closeHours || '22:00'
        )

        placeObj.isOpen = isOpen
        placeObj.currentTime = currentHour

        return placeObj
      })

      return response.ok(placesWithStatus)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal memuat data tempat',
      })
    }
  }

  // --- HELPER FUNCTIONS (Fungsi Pembantu) ---

  // Helper 1: Ambil waktu sekarang
  private async getCurrentTime(): Promise<string> {
    try {
      // Coba panggil Time Controller internal kita
      const timeResponse = await fetch('http://localhost:3333/time/palu')
      const timeData = (await timeResponse.json()) as { timeString?: string } // Add type

      if (timeData.timeString) {
        // Format dari "22:12:42" menjadi "22:12"
        const timeStr = timeData.timeString.toString().replace(/\./g, ':')
        const parts = timeStr.split(':')
        return `${parts[0]}:${parts[1]}`
      }
    } catch (e) {
      console.log('⚠️ Time API internal error, pakai waktu server')
    }

    // Fallback: Waktu server default
    return '22:00'
  }

  // Helper 2: Hitung Status Buka/Tutup
  private calculateOpenStatus(
    currentParams: string,
    openParams: string,
    closeParams: string
  ): boolean {
    const [curH, curM] = currentParams.split(':').map(Number)
    const [openH, openM] = openParams.split(':').map(Number)
    const [closeH, closeM] = closeParams.split(':').map(Number)

    const currentMinutes = curH * 60 + curM
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    // Kasus 1: Buka 24 Jam
    if (openParams === '00:00' && closeParams === '23:59') return true

    // Kasus 2: Buka sampai lewat tengah malam (contoh 21:00 - 02:00)
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes
    }

    // Kasus 3: Jam operasional normal (contoh 08:00 - 22:00)
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
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
      const data = request.only([
        'name',
        'location',
        'description',
        'category',
        'capacity',
        'image',
        'owner_id',
        'openHours',
        'closeHours',
      ])

      // Simple validation: check if owner_id exists and is actually an owner
      const owner = await User.findById(data.owner_id)
      if (!owner || owner.role !== 'owner') {
        return response.badRequest({ message: 'Invalid owner' })
      }

      // Auto-geocode location to get coordinates
      let coordinates: { lat: number | null; lng: number | null } = { lat: null, lng: null }
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location)}, Palu, Sulawesi Tengah&format=json&limit=1`
        const geocodeResponse = await fetch(geocodeUrl)
        const geocodeData = (await geocodeResponse.json()) as any[] // Explicit type assertion

        if (geocodeData.length > 0) {
          coordinates = {
            lat: parseFloat(geocodeData[0].lat),
            lng: parseFloat(geocodeData[0].lon),
          }
        }
      } catch (geocodeError) {
        // Geocoding failed, use null coordinates
      }

      const place = await Place.create({
        ...data,
        coordinates,
        status: 'pending', // Always pending, need admin approval
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
      const data = request.only([
        'name',
        'location',
        'description',
        'category',
        'capacity',
        'image',
        'openHours',
        'closeHours',
      ])

      const place = await Place.findByIdAndUpdate(params.id, data, { new: true })

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
      return response.ok(places)
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get all places',
      })
    }
  }

  // Approve or reject place
  async approve({ params, request, response }: HttpContext) {
    try {
      const { status } = request.only(['status']) // 'approved' or 'rejected'

      const place = await Place.findByIdAndUpdate(params.id, { status }, { new: true }).populate(
        'owner_id',
        'name email'
      )

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
