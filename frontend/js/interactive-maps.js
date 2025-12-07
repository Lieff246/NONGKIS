// Interactive Maps using Leaflet.js
class InteractiveMaps {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.selectedLocation = null;
    }

    // Initialize map for owner (location picker)
    initOwnerMap(containerId, callback) {
        // Palu center coordinates
        const paluCenter = [-0.8917, 119.8707];
        
        this.map = L.map(containerId).setView(paluCenter, 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add click handler for location selection
        this.map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            
            // Remove previous marker
            if (this.selectedLocation) {
                this.map.removeLayer(this.selectedLocation);
            }
            
            // Add new marker
            this.selectedLocation = L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup('📍 Lokasi yang dipilih')
                .openPopup();
            
            // Call callback with coordinates
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
        
        // Add markers for all places
        this.addPlaceMarkers(places);
        
        // Add user location if available
        this.addUserLocation();
        
        return this.map;
    }
    
    // Add markers for places
    addPlaceMarkers(places) {
        this.clearMarkers();
        
        console.log('🗺️ Adding markers for places:', places.length);
        
        places.forEach((place, index) => {
            console.log(`🗺️ Place ${index + 1}:`, {
                name: place.name,
                location: place.location,
                coordinates: place.coordinates
            });
            
            if (place.coordinates && place.coordinates.lat && place.coordinates.lng) {
                const marker = L.marker([place.coordinates.lat, place.coordinates.lng])
                    .addTo(this.map);
                
                // Create popup content
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
                            <button onclick="showRouteFromMap('${place._id}')" class="route-btn">
                                🗺️ Rute
                            </button>
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers.push(marker);
            }
        });
        
        // Fit map to show all markers
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
    
    // Show route between two points
    showRoute(startLat, startLng, endLat, endLng) {
        // Simple line for now (can be enhanced with routing service)
        const route = L.polyline([
            [startLat, startLng],
            [endLat, endLng]
        ], {
            color: 'red',
            weight: 3,
            opacity: 0.7
        }).addTo(this.map);
        
        // Fit map to show route
        this.map.fitBounds(route.getBounds().pad(0.1));
        
        return route;
    }
    
    // Get coordinates from address
    async geocodeAndAddMarker(address) {
        try {
            const result = await MapsService.geocodeAddress(address);
            
            if (result.found) {
                // Remove previous marker
                if (this.selectedLocation) {
                    this.map.removeLayer(this.selectedLocation);
                }
                
                // Add marker at geocoded location
                this.selectedLocation = L.marker([result.coordinates.lat, result.coordinates.lng])
                    .addTo(this.map)
                    .bindPopup(`📍 ${result.display_name}`)
                    .openPopup();
                
                // Center map on location
                this.map.setView([result.coordinates.lat, result.coordinates.lng], 15);
                
                return result.coordinates;
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

window.showRouteFromMap = function(placeId) {
    if (typeof showRoute === 'function') {
        // Find place data and show route
        const place = allPlaces?.find(p => p._id === placeId);
        if (place) {
            console.log('🗺️ Showing route from map for place:', place);
            showRoute(placeId, place.location);
        } else {
            console.error('❌ Place not found in allPlaces:', placeId);
            alert('Tempat tidak ditemukan');
        }
    } else {
        console.error('❌ showRoute function not available');
    }
};

// Export for global use
window.InteractiveMaps = InteractiveMaps;