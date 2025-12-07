import type { HttpContext } from '@adonisjs/core/http'

export default class MapsController {
  // Simple coordinate parser - no external geocoding API
  async geocode({ params, response }: HttpContext) {
    try {
      const address = params.address

      // Try to parse if it's already coordinates
      const parts = address.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim())
        const lng = parseFloat(parts[1].trim())

        if (!isNaN(lat) && !isNaN(lng)) {
          return response.json({
            address: address,
            coordinates: { lat, lng },
            display_name: `${address}, Palu`,
            found: true,
          })
        }
      }

      // Fallback to Palu center
      return response.json({
        address: address,
        coordinates: {
          lat: -0.8917,
          lng: 119.8707,
        },
        display_name: `${address}, Palu`,
        found: false,
        fallback: true,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal memproses koordinat',
        error: error.message,
      })
    }
  }

  // Route navigation: dari user ke tempat
  async getRoute({ request, response }: HttpContext) {
    console.log('🗺️ === ROUTE REQUEST START ===')
    console.log('🗺️ Request URL:', request.url())
    console.log('🗺️ Query string:', request.qs())

    try {
      const { startLat, startLng, endLat, endLng } = request.qs()

      console.log('🗺️ Parameters:', { startLat, startLng, endLat, endLng })

      if (!startLat || !startLng || !endLat || !endLng) {
        console.log('❌ Missing parameters')
        return response.badRequest({
          message: 'Parameter koordinat tidak lengkap',
          required: ['startLat', 'startLng', 'endLat', 'endLng'],
          received: { startLat, startLng, endLat, endLng },
        })
      }

      // Simple fallback calculation (skip external API for now)
      console.log('🗺️ Calculating route...')
      const distance = this.calculateDistance(
        parseFloat(startLat),
        parseFloat(startLng),
        parseFloat(endLat),
        parseFloat(endLng)
      )

      const result = {
        distance: Math.round(distance),
        duration: Math.round(distance / 1.4), // asumsi jalan kaki 1.4 m/s
        coordinates: [
          [parseFloat(startLng), parseFloat(startLat)],
          [parseFloat(endLng), parseFloat(endLat)],
        ],
        instructions: [
          'Mulai perjalanan',
          `Berjalan menuju tujuan sejauh ${this.formatDistance(distance)}`,
          'Tiba di tujuan',
        ],
        fallback: true,
        message: 'Rute berhasil dihitung',
      }

      console.log('🗺️ Route result:', result)
      console.log('🗺️ Sending response...')

      const jsonResponse = response.json(result)
      console.log('🗺️ Response sent successfully')
      return jsonResponse
    } catch (error) {
      console.error('❌ Route error:', error)
      console.error('❌ Error stack:', error.stack)

      const errorResponse = response.status(500).json({
        message: 'Gagal mendapatkan rute',
        error: error.message,
        stack: error.stack,
      })

      console.log('🗺️ Error response sent')
      return errorResponse
    } finally {
      console.log('🗺️ === ROUTE REQUEST END ===')
    }
  }

  // Helper: format distance for display
  private formatDistance(meters: number) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  // Helper: format navigation instructions
  private formatInstructions(steps: any[]) {
    return steps
      .map((step) => {
        const instruction = step.instruction || 'Lanjutkan'
        const distance = Math.round(step.distance)
        return `${instruction} (${distance}m)`
      })
      .slice(0, 5) // max 5 instruksi
  }

  // Helper: calculate straight line distance (Haversine formula)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // distance in meters
  }
}
