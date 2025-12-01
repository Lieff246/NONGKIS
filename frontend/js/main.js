// Global Variables
let currentUser = null;
let allPlaces = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadPlaces();
    setupEventListeners();
});

// Check if user is logged in
function checkLoginStatus() {
    const userData = localStorage.getItem('nongkis_user');
    const token = localStorage.getItem('nongkis_token');
    
    if (userData && token) {
        currentUser = JSON.parse(userData);
        updateNavigation();
    }
}

// Update navigation based on login status
function updateNavigation() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;
    
    if (currentUser) {
        if (currentUser.role === 'admin') {
            navMenu.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="#tempat" class="nav-link">Tempat</a>
                <a href="admin-dashboard.html" class="nav-link">Admin</a>
                <a href="#" class="nav-link" onclick="logout()">Logout (${currentUser.name})</a>
            `;
        } else {
            navMenu.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="#tempat" class="nav-link">Tempat</a>
                <a href="dashboard.html" class="nav-link">Dashboard</a>
                <a href="#" class="nav-link" onclick="logout()">Logout (${currentUser.name})</a>
            `;
        }
        // Refresh places display to show correct buttons
        if (allPlaces.length > 0) {
            displayPlaces(allPlaces);
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPlaces();
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterPlaces();
        });
    }
}

// Load places from API
async function loadPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat...</div>';
        
        allPlaces = await API.getPlaces();
        displayPlaces(allPlaces);
        
        // Update navigation after loading places
        updateNavigation();
        
    } catch (error) {
        console.error('Error loading places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat</div>';
    }
}

// Display places in grid
function displayPlaces(places) {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="loading">🔍 Tidak ada tempat ditemukan</div>';
        return;
    }
    
    placesList.innerHTML = places.map(place => createPlaceCard(place)).join('');
}

// Create place card HTML
function createPlaceCard(place) {
    return `
        <div class="place-card">
            <div class="place-content">
                <h3>${place.name}</h3>
                <div class="place-info">
                    <p>📍 ${place.location}</p>
                    <p>📝 ${place.description}</p>
                </div>
                <div class="place-actions">
                    ${currentUser ? 
                        `<button onclick="bookPlace('${place._id}')" class="book-button">
                            📅 Booking Sekarang
                        </button>` :
                        `<button onclick="showLoginAlert()" class="login-button">
                            🔐 Login untuk Booking
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;
}

// Filter places based on search and category
function filterPlaces() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    
    let filteredPlaces = allPlaces;
    
    // Filter by search term
    if (searchTerm) {
        filteredPlaces = filteredPlaces.filter(place => 
            place.name.toLowerCase().includes(searchTerm) ||
            place.location.toLowerCase().includes(searchTerm) ||
            place.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category (if needed - backend doesn't have category yet)
    if (category) {
        // This would work if backend had category field
        // filteredPlaces = filteredPlaces.filter(place => place.category === category);
    }
    
    displayPlaces(filteredPlaces);
}

// Book a place
async function bookPlace(placeId) {
    if (!currentUser) {
        showLoginAlert();
        return;
    }
    
    const place = allPlaces.find(p => p._id === placeId);
    if (!place) return;
    
    // Simple booking form
    const date = prompt(`Booking ${place.name}\n\nMasukkan tanggal (YYYY-MM-DD):`, 
        new Date().toISOString().split('T')[0]);
    
    if (!date) return;
    
    const time = prompt('Masukkan waktu (HH:MM):', '10:00');
    if (!time) return;
    
    try {
        const bookingData = {
            placeId: placeId,
            date: date,
            time: time
        };
        
        const result = await API.createBooking(bookingData, currentUser.id);
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
        } else {
            showNotification('❌ Gagal membuat booking', 'error');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Show login alert
function showLoginAlert() {
    showNotification('🔐 Silakan login terlebih dahulu', 'info');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Logout function
function logout() {
    localStorage.removeItem('nongkis_user');
    localStorage.removeItem('nongkis_token');
    currentUser = null;
    showNotification('👋 Logout berhasil!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Export functions for global use
window.bookPlace = bookPlace;
window.logout = logout;
window.showLoginAlert = showLoginAlert;