// API Configuration
const API_URL = 'http://localhost:3333';

// API Helper Functions
class API {
    // Get all places
    static async getPlaces() {
        try {
            const response = await fetch(`${API_URL}/places`);
            if (!response.ok) throw new Error('Failed to fetch places');
            return await response.json();
        } catch (error) {
            console.error('Error getting places:', error);
            return [];
        }
    }

    // User registration
    static async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error registering:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // User login
    static async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Create admin
    static async createAdmin(adminData) {
        try {
            const response = await fetch(`${API_URL}/auth/create-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adminData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating admin:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Get user profile
    static async getProfile(token) {
        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting profile:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Create booking
    static async createBooking(bookingData, userId) {
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                },
                body: JSON.stringify(bookingData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating booking:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Get all bookings (admin)
    static async getBookings() {
        try {
            const response = await fetch(`${API_URL}/bookings`);
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('Error getting bookings:', error);
            return [];
        }
    }

    // Get owner bookings
    static async getOwnerBookings(ownerId) {
        try {
            const response = await fetch(`${API_URL}/bookings/owner/${ownerId}`);
            if (!response.ok) throw new Error('Failed to fetch owner bookings');
            return await response.json();
        } catch (error) {
            console.error('Error getting owner bookings:', error);
            return [];
        }
    }

    // Delete booking (admin only)
    static async deleteBooking(bookingId, token) {
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting booking:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Update booking status (admin only)
    static async updateBookingStatus(bookingId, status, token) {
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating booking status:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Admin: Create place
    static async createPlace(placeData, token) {
        try {
            const response = await fetch(`${API_URL}/places`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(placeData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating place:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Admin: Update place
    static async updatePlace(placeId, placeData, token) {
        try {
            const response = await fetch(`${API_URL}/places/${placeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(placeData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating place:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Admin: Delete place
    static async deletePlace(placeId, token) {
        try {
            const response = await fetch(`${API_URL}/places/${placeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting place:', error);
            return { success: false, message: 'Network error' };
        }
    }
}

// Export for global use
window.API = API;