// Admin Dashboard JavaScript
let currentUser = null;
let adminToken = null;
let allPlaces = [];
let allBookings = [];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadPlaces();
    loadBookings();
    setupEventListeners();
});

// Check admin authentication
function checkAdminAuth() {
    const userData = localStorage.getItem('nongkis_user');
    const token = localStorage.getItem('nongkis_token');
    
    if (!userData || !token) {
        alert('❌ Silakan login sebagai admin');
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    adminToken = token;
    
    if (currentUser.role !== 'admin') {
        alert('❌ Akses ditolak! Hanya untuk admin');
        window.location.href = 'dashboard.html';
        return;
    }
}

// Setup event listeners
function setupEventListeners() {
    const placeForm = document.getElementById('placeForm');
    if (placeForm) {
        placeForm.addEventListener('submit', handlePlaceSubmit);
    }
}

// Load places
async function loadPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat...</div>';
        
        allPlaces = await API.getPlaces();
        displayPlaces(allPlaces);
        updateStats();
        
    } catch (error) {
        console.error('Error loading places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat</div>';
    }
}

// Display places
function displayPlaces(places) {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="no-data">Belum ada tempat</div>';
        return;
    }
    
    placesList.innerHTML = places.map(place => `
        <div class="place-card">
            <div class="place-content">
                <h3>${place.name}</h3>
                <div class="place-info">
                    <p>📍 ${place.location}</p>
                    <p>📝 ${place.description}</p>
                </div>
                <div class="place-actions">
                    <button onclick="editPlace('${place._id}')" class="book-button">
                        ✏️ Edit
                    </button>
                    <button onclick="deletePlace('${place._id}')" class="login-button">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle place form submit
async function handlePlaceSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = '🔄 Menyimpan...';
        submitBtn.disabled = true;
        
        const placeData = {
            name: document.getElementById('placeName').value,
            location: document.getElementById('placeLocation').value,
            description: document.getElementById('placeDescription').value
        };
        
        const editId = document.getElementById('editPlaceId').value;
        let result;
        
        if (editId) {
            // Update existing place
            result = await API.updatePlace(editId, placeData, adminToken);
        } else {
            // Create new place
            result = await API.createPlace(placeData, adminToken);
        }
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            resetPlaceForm();
            loadPlaces();
        } else {
            showNotification('❌ Gagal menyimpan tempat', 'error');
        }
        
    } catch (error) {
        console.error('Error saving place:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Edit place
function editPlace(placeId) {
    const place = allPlaces.find(p => p._id === placeId);
    if (!place) return;
    
    document.getElementById('editPlaceId').value = placeId;
    document.getElementById('placeName').value = place.name;
    document.getElementById('placeLocation').value = place.location;
    document.getElementById('placeDescription').value = place.description;
    
    document.getElementById('formTitle').textContent = 'Edit Tempat';
    document.getElementById('submitBtn').textContent = 'Update Tempat';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

// Cancel edit
function cancelEdit() {
    resetPlaceForm();
}

// Reset place form
function resetPlaceForm() {
    document.getElementById('placeForm').reset();
    document.getElementById('editPlaceId').value = '';
    document.getElementById('formTitle').textContent = 'Tambah Tempat Baru';
    document.getElementById('submitBtn').textContent = 'Tambah Tempat';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Delete place
async function deletePlace(placeId) {
    if (!confirm('Yakin ingin menghapus tempat ini?')) return;
    
    try {
        const result = await API.deletePlace(placeId, adminToken);
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            loadPlaces();
        } else {
            showNotification('❌ Gagal menghapus tempat', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting place:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Load bookings
async function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;
    
    try {
        bookingsList.innerHTML = '<div class="loading">🔄 Memuat booking...</div>';
        
        allBookings = await API.getBookings();
        displayBookings(allBookings);
        updateStats();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<div class="loading">❌ Gagal memuat booking</div>';
    }
}

// Display bookings
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<div class="no-data">Belum ada booking</div>';
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h4>${booking.place?.name || 'Tempat'}</h4>
                <span class="booking-status pending">Pending</span>
            </div>
            <div class="booking-info">
                <p><strong>Nama:</strong> ${booking.customerName}</p>
                <p><strong>Email:</strong> ${booking.customerEmail}</p>
                <p><strong>Tanggal:</strong> ${booking.date}</p>
                <p><strong>Waktu:</strong> ${booking.time}</p>
            </div>
            <div class="booking-actions">
                <button onclick="confirmBooking('${booking._id}')" class="book-button">
                    ✅ Konfirmasi
                </button>
                <button onclick="cancelBooking('${booking._id}')" class="login-button">
                    ❌ Tolak
                </button>
                <button onclick="deleteBooking('${booking._id}')" class="btn-delete">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Confirm booking
async function confirmBooking(bookingId) {
    if (!confirm('Konfirmasi booking ini?')) return;
    
    try {
        const result = await API.updateBookingStatus(bookingId, 'confirmed', adminToken);
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            // For now, just show notification since backend doesn't support status update
        } else {
            showNotification('❌ Gagal mengkonfirmasi booking', 'error');
        }
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Tolak booking ini?')) return;
    
    try {
        const result = await API.updateBookingStatus(bookingId, 'cancelled', adminToken);
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            // For now, just show notification since backend doesn't support status update
        } else {
            showNotification('❌ Gagal menolak booking', 'error');
        }
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Delete booking
async function deleteBooking(bookingId) {
    if (!confirm('Yakin ingin menghapus booking ini?')) return;
    
    try {
        const result = await API.deleteBooking(bookingId, adminToken);
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            loadBookings();
        } else {
            showNotification('❌ Gagal menghapus booking', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting booking:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Update stats
function updateStats() {
    document.getElementById('totalPlaces').textContent = allPlaces.length;
    document.getElementById('totalBookings').textContent = allBookings.length;
}

// Show notification
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('nongkis_user');
    localStorage.removeItem('nongkis_token');
    alert('👋 Logout berhasil!');
    window.location.href = 'index.html';
}

// Export functions
window.editPlace = editPlace;
window.deletePlace = deletePlace;
window.confirmBooking = confirmBooking;
window.cancelBooking = cancelBooking;
window.deleteBooking = deleteBooking;
window.cancelEdit = cancelEdit;
window.loadBookings = loadBookings;
window.logout = logout;