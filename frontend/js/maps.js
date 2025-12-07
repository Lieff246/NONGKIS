// Maps Service - OpenStreetMap Integration
class MapsService {
    static parseCoordinates(locationString) {
        // Try to parse coordinates from string like "-0.900258, 119.888771"
        const parts = locationString.split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            
            if (!isNaN(lat) && !isNaN(lng)) {
                return {
                    coordinates: { lat, lng },
                    found: true
                };
            }
        }
        
        // Fallback: Palu center
        return {
            coordinates: {
                lat: -0.8917,
                lng: 119.8707
            },
            found: false,
            fallback: true
        };
    }
    
    static async getRoute(startLat, startLng, endLat, endLng) {
        try {
            const params = new URLSearchParams({
                startLat: startLat,
                startLng: startLng,
                endLat: endLat,
                endLng: endLng
            });
            
            const response = await fetch(`/maps/route?${params}`);
            
            if (!response.ok) {
                throw new Error('Route calculation failed');
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Route error:', error);
            // Fallback: simple straight line
            const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
            return {
                distance: Math.round(distance),
                duration: Math.round(distance / 1.4),
                coordinates: [[startLng, startLat], [endLng, endLat]],
                instructions: ['Berjalan menuju tujuan'],
                fallback: true
            };
        }
    }
    
    // Get user's current location
    static async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                // Fallback: Palu center
                resolve({
                    lat: -0.8917,
                    lng: 119.8707,
                    fallback: true
                });
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Fallback: Palu center
                    resolve({
                        lat: -0.8917,
                        lng: 119.8707,
                        fallback: true
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    // Format distance for display
    static formatDistance(meters) {
        if (meters < 1000) {
            return `${meters}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }
    
    // Format duration for display
    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} detik`;
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)} menit`;
        } else {
            return `${Math.round(seconds / 3600)} jam`;
        }
    }
    
    // Calculate straight line distance (fallback)
    static calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lng2-lng1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // distance in meters
    }
    

}

// Export for global use
window.MapsService = MapsService;