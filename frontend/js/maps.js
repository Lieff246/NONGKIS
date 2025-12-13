// Maps Service - Unified Maps & Interactive Maps
class MapsService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.selectedLocation = null;
    }

    // Parse coordinates from string
    static parseCoordinates(locationString) {
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
    
    // Get user's current location
    static async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
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
                    resolve({
                        lat: -0.8917,
                        lng: 119.8707,
                        fallback: true
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // Initialize map for owner (location picker)
    initOwnerMap(containerId, callback) {
        const paluCenter = [-0.8917, 119.8707];
        
        this.map = L.map(containerId).setView(paluCenter, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        this.map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            
            if (this.selectedLocation) {
                this.map.removeLayer(this.selectedLocation);
            }
            
            this.selectedLocation = L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup('📍 Lokasi yang dipilih')
                .openPopup();
            
            if (callback) {
                callback(lat, lng);
            }
        });
        
        return this.map;
    }
    
    // Initialize map for viewing places
    initPlacesMap(containerId, places) {
        const paluCenter = [-0.8917, 119.8707];
        
        this.map = L.map(containerId).setView(paluCenter, 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        this.addPlaceMarkers(places);
        this.addUserLocation();
        
        return this.map;
    }
    
    // Add markers for places
    addPlaceMarkers(places) {
        this.clearMarkers();
        
        places.forEach((place) => {
            if (place.coordinates && place.coordinates.lat && place.coordinates.lng) {
                const marker = L.marker([place.coordinates.lat, place.coordinates.lng])
                    .addTo(this.map);
                
                const popupContent = `
                    <div class="map-popup">
                        <h4>${place.name}</h4>
                        <p>📍 ${place.location}</p>
                        <p>🏷️ ${place.category}</p>
                        <p>👥 ${place.capacity} orang</p>
                        ${place.description ? `<p>📝 ${place.description}</p>` : ''}
                        <div class="popup-actions">
                            <button onclick="bookFromMap('${place._id}')" class="book-btn">
                                📅 Booking
                            </button>
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers.push(marker);
            }
        });
        
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    // Add user location marker
    async addUserLocation() {
        try {
            const userLocation = await MapsService.getCurrentLocation();
            
            if (!userLocation.fallback) {
                this.userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue">
                                <circle cx="12" cy="12" r="8"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                            </svg>
                        `),
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(this.map);
                
                this.userMarker.bindPopup('📍 Lokasi Anda');
            }
        } catch (error) {
            console.log('Could not get user location for map');
        }
    }
    
    // Clear all markers
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }
    
    // Geocode address and add marker
    async geocodeAndAddMarker(address) {
        try {
            const response = await fetch(`/maps/geocode/${encodeURIComponent(address)}`);
            const result = await response.json();
            
            if (response.ok && result.lat && result.lng) {
                if (this.selectedLocation) {
                    this.map.removeLayer(this.selectedLocation);
                }
                
                this.selectedLocation = L.marker([result.lat, result.lng])
                    .addTo(this.map)
                    .bindPopup(`📍 ${result.display_name}`)
                    .openPopup();
                
                this.map.setView([result.lat, result.lng], 15);
                
                return { lat: result.lat, lng: result.lng };
            }
        } catch (error) {
            console.error('Geocoding failed:', error);
        }
        return null;
    }
    
    // Destroy map
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// Global functions for map popups
window.bookFromMap = function(placeId) {
    if (typeof bookPlace === 'function') {
        bookPlace(placeId);
    } else {
        alert('Login untuk booking tempat ini');
    }
};

// Export for global use
window.MapsService = MapsService;
window.InteractiveMaps = MapsService; // Alias for backward compatibility