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

// Load approved places (default view)
async function loadPlaces() {
    showApprovedPlaces();
}

// Show approved places
async function showApprovedPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat approved...</div>';
        
        allPlaces = await API.getPlaces();
        displayApprovedPlaces(allPlaces);
        updateStats();
        
        // Update tab active state
        updateTabState('approved');
        
    } catch (error) {
        console.error('Error loading places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat</div>';
    }
}

// Show pending places for approval
async function showPendingPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat pending...</div>';
        
        // Call API to get pending places (need to add this to API.js)
        const response = await fetch(`http://localhost:3333/places/pending`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const pendingPlaces = await response.json();
        
        displayPendingPlaces(pendingPlaces);
        
        // Update tab active state
        updateTabState('pending');
        
    } catch (error) {
        console.error('Error loading pending places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat pending</div>';
    }
}

// Display approved places
function displayApprovedPlaces(places) {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="no-data">Belum ada tempat approved</div>';
        return;
    }
    
    placesList.innerHTML = places.map(place => {
        const imageUrl = place.image || 'https://via.placeholder.com/300x200?text=Tempat+Nongkrong';
        return `
            <div class="place-card">
                <div class="place-image" style="height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                    <img src="${imageUrl}" alt="${place.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Tempat+Nongkrong'">
                </div>
                <div class="place-content">
                    <h3>${place.name}</h3>
                    <div class="place-info">
                        <p>📍 ${place.location}</p>
                        <p>📝 ${place.description}</p>
                        <p>🏢 Owner: ${place.owner_id?.name || 'Unknown'}</p>
                    </div>
                    <div class="place-actions">
                        <button onclick="deletePlace('${place._id}')" class="login-button">
                            🗑️ Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display pending places for approval
function displayPendingPlaces(places) {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="no-data">Tidak ada tempat pending</div>';
        return;
    }
    
    placesList.innerHTML = places.map(place => {
        const imageUrl = place.image || 'https://via.placeholder.com/300x200?text=Tempat+Nongkrong';
        return `
            <div class="place-card" style="border-left: 4px solid #ffc107;">
                <div class="place-image" style="height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                    <img src="${imageUrl}" alt="${place.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Tempat+Nongkrong'">
                </div>
                <div class="place-content">
                    <h3>${place.name} <span style="color:#ffc107; font-size:0.8em;">[PENDING]</span></h3>
                    <div class="place-info">
                        <p>📍 ${place.location}</p>
                        <p>📝 ${place.description}</p>
                        <p>🏢 Owner: ${place.owner_id?.name} (${place.owner_id?.email})</p>
                        <p>🏷️ Kategori: ${place.category}</p>
                        <p>👥 Kapasitas: ${place.capacity} orang</p>
                    </div>
                    <div class="place-actions">
                        <button onclick="approvePlace('${place._id}', 'approved')" class="book-button">
                            ✅ Approve
                        </button>
                        <button onclick="approvePlace('${place._id}', 'rejected')" class="login-button">
                            ❌ Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
    console.log('🔄 loadBookings() called');
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) {
        console.log('❌ bookingsList element not found');
        return;
    }
    
    try {
        bookingsList.innerHTML = '<div class="loading">🔄 Memuat booking...</div>';
        
        console.log('Fetching bookings from API...');
        allBookings = await API.getBookings();
        console.log('Bookings loaded:', allBookings.length, 'items');
        
        // Show all bookings with their IDs and statuses
        allBookings.forEach((booking, index) => {
            console.log(`Booking ${index + 1}:`, {
                id: booking._id,
                status: booking.status,
                customerName: booking.customerName
            });
        });
        
        console.log('Sample booking FULL:', JSON.stringify(allBookings[0], null, 2));
        console.log('Sample booking status:', allBookings[0]?.status);
        
        displayBookings(allBookings);
        updateStats();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<div class="loading">❌ Gagal memuat booking</div>';
    }
}

// Get booking status display (admin hanya monitoring)
function getBookingStatusDisplay(booking) {
    const status = booking.status || 'pending';
    const statusMap = {
        'pending': '⏳ Menunggu Owner',
        'approved': '✅ Disetujui Owner', 
        'rejected': '❌ Ditolak Owner'
    };
    
    const statusText = statusMap[status] || status.toUpperCase();
    const statusColor = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : '#ffc107';
    
    return `<span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>`;
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
                <h4>📍 ${booking.place?.name || 'Tempat'}</h4>
                <span class="booking-status ${booking.status || 'pending'}">${booking.status ? booking.status.toUpperCase() : 'PENDING'}</span>
            </div>
            <div class="booking-info">
                <p><strong>👤 Customer:</strong> ${booking.customerName}</p>
                <p><strong>📧 Email:</strong> ${booking.customerEmail}</p>
                <p><strong>👥 Jumlah:</strong> ${booking.capacity || 1} orang</p>
                <p><strong>📅 Tanggal:</strong> ${booking.date}</p>
                <p><strong>⏰ Waktu:</strong> ${booking.time}</p>
                <p><strong>🏢 Owner:</strong> ${booking.owner?.name || 'Unknown'}</p>
            </div>
            <div class="booking-status-display">
                ${getBookingStatusDisplay(booking)}
            </div>
        </div>
    `).join('');
}

// Admin hanya monitoring - tidak ada aksi booking

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

// Approve or reject place
async function approvePlace(placeId, status) {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!confirm(`Yakin ingin ${action} tempat ini?`)) return;
    
    try {
        const response = await fetch(`http://localhost:3333/places/${placeId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            showPendingPlaces(); // Refresh pending list
        } else {
            showNotification('❌ Gagal update status tempat', 'error');
        }
        
    } catch (error) {
        console.error('Error approving place:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// Update tab active state
function updateTabState(activeTab) {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (activeTab === 'approved') {
        tabs[0].classList.add('active');
    } else {
        tabs[1].classList.add('active');
    }
}

// Export functions - Admin hanya untuk tempat dan monitoring
window.editPlace = editPlace;
window.deletePlace = deletePlace;
window.cancelEdit = cancelEdit;
window.loadBookings = loadBookings;
window.showApprovedPlaces = showApprovedPlaces;
window.showPendingPlaces = showPendingPlaces;
window.approvePlace = approvePlace;
window.logout = logout;