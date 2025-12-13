import type { HttpContext } from '@adonisjs/core/http'

export default class MapsController {
  // Geocoding using Public API (Nominatim OpenStreetMap)
  async geocode({ params, response }: HttpContext) {
    try {
      const address = params.address
      console.log('🗺️ Geocoding address:', address)

      // Try Nominatim OpenStreetMap API (Public API)
      try {
        console.log('🌍 Trying Nominatim API...')
        const query = encodeURIComponent(`${address}, Palu, Indonesia`)
        const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
        console.log('🔗 API URL:', apiUrl)
        
        const apiResponse = await fetch(apiUrl)
        console.log('📡 Nominatim Status:', apiResponse.status)

        if (apiResponse.ok) {
          const data = await apiResponse.json()
          console.log('📊 API Response:', data)
          
          if (data && data.length > 0) {
            const result = data[0]
            console.log('🌍 Nominatim API SUCCESS')
            
            return response.json({
              address: address,
              coordinates: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
              },
              display_name: result.display_name,
              found: true,
              source: 'Nominatim OpenStreetMap API'
            })
          } else {
            console.log('⚠️ Nominatim API: No results found')
          }
        } else {
          console.log('❌ Nominatim HTTP Error:', apiResponse.status, apiResponse.statusText)
        }
      } catch (error) {
        console.log('⚠️ Nominatim API failed:', error.message)
      }
      
      // Try alternative geocoding API (Photon)
      try {
        console.log('🔄 Trying Photon API...')
        const query = encodeURIComponent(`${address} Palu Indonesia`)
        const apiResponse = await fetch(
          `https://photon.komoot.io/api/?q=${query}&limit=1`
        )
        
        if (apiResponse.ok) {
          const data = await apiResponse.json()
          
          if (data.features && data.features.length > 0) {
            const result = data.features[0]
            console.log('🌍 Photon API SUCCESS')
            
            return response.json({
              address: address,
              coordinates: {
                lat: result.geometry.coordinates[1],
                lng: result.geometry.coordinates[0]
              },
              display_name: result.properties.name || `${address}, Palu`,
              found: true,
              source: 'Photon Geocoding API'
            })
          }
        }
      } catch (error) {
        console.log('⚠️ Photon API failed:', error.message)
      }

      // Try parsing coordinates directly
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
            source: 'Direct coordinates'
          })
        }
      }

      // Fallback to Palu center
      console.log('🚨 Using fallback coordinates')
      return response.json({
        address: address,
        coordinates: {
          lat: -0.8917,
          lng: 119.8707,
        },
        display_name: `${address}, Palu, Indonesia`,
        found: false,
        fallback: true,
        source: 'Fallback (Palu center)'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal memproses koordinat',
        error: error.message,
      })
    }
  }
}
