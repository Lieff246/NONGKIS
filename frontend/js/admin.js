// --- 1. KONFIGURASI GLOBAL ---
let currentUser = null;
let adminToken = null;
let allPlaces = [];
let allBookings = [];

// Saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();      // 1. Cek Login
    loadPlaces();          // 2. Ambil Data Tempat
    loadBookings();        // 3. Ambil Data Booking
    setupEventListeners(); // 4. Siapkan Tombol-tombol
});

// --- 2. AUTHENTICATION (Login/Logout) ---

// Cek apakah user sudah login sebagai Admin
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

// Fungsi Logout
function logout() {
    localStorage.removeItem('nongkis_user');
    localStorage.removeItem('nongkis_token');
    alert('👋 Logout berhasil!');
    window.location.href = 'index.html';
}

// --- 3. MANAJEMEN TEMPAT (PLACES) ---

// Setup event listeners untuk form tempat
function setupEventListeners() {
    const placeForm = document.getElementById('placeForm');
    if (placeForm) {
        placeForm.addEventListener('submit', handlePlaceSubmit);
    }
}

// A. Tampilkan Tempat Approved (Default)
async function loadPlaces() {
    showApprovedPlaces();
}

async function showApprovedPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat approved...</div>';
        
        allPlaces = await API.getPlaces();
        displayPlaces(allPlaces, 'approved');
        updateStats();
        updateTabState('approved');
        
    } catch (error) {
        console.error('Error loading places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat</div>';
    }
}

// B. Tampilkan Tempat Pending
async function showPendingPlaces() {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    try {
        placesList.innerHTML = '<div class="loading">🔄 Memuat tempat pending...</div>';
        
        // Panggil endpoint khusus pending
        const response = await fetch(`http://localhost:3333/places/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const pendingPlaces = await response.json();
        
        displayPlaces(pendingPlaces, 'pending');
        updateTabState('pending');
        
    } catch (error) {
        console.error('Error loading pending places:', error);
        placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat pending</div>';
    }
}

// C. Render Tampilan Tempat (Approved & Pending digabung biar rapi)
function displayPlaces(places, type) {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (places.length === 0) {
        placesList.innerHTML = `<div class="no-data">Belum ada tempat ${type}</div>`;
        return;
    }
    
    placesList.innerHTML = places.map(place => {
        const imageUrl = place.image || 'https://via.placeholder.com/300x200?text=Tempat+Nongkrong';
        const isPending = type === 'pending';
        
        return `
            <div class="place-card" style="${isPending ? 'border-left: 4px solid #ffc107;' : ''}">
                <div class="place-image" style="height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                    <img src="${imageUrl}" alt="${place.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Tempat+Nongkrong'">
                </div>
                <div class="place-content">
                    <h3>${place.name} ${isPending ? '<span style="color:#ffc107; font-size:0.8em;">[PENDING]</span>' : ''}</h3>
                    <div class="place-info">
                        <p>📍 ${place.location}</p>
                        <p>📝 ${place.description}</p>
                        <p>🏢 Owner: ${place.owner_id?.name || 'Unknown'}</p>
                        ${isPending ? `<p>🏷️ Kategori: ${place.category}</p>` : ''}
                        ${isPending ? `<p>👥 Kapasitas: ${place.capacity} orang</p>` : ''}
                    </div>
                    <div class="place-actions">
                        ${isPending ? 
                            // Tombol untuk Pending: Approve & Reject
                            `
                            <button onclick="approvePlace('${place._id}', 'approved')" class="book-button">✅ Approve</button>
                            <button onclick="approvePlace('${place._id}', 'rejected')" class="login-button">❌ Reject</button>
                            ` 
                            : 
                            // Tombol untuk Approved: Hapus saja
                            `
                            <button onclick="deletePlace('${place._id}')" class="login-button">🗑️ Hapus</button>
                            `
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// D. Approve / Reject Tempat
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
            showPendingPlaces(); // Refresh list pending
        } else {
            showNotification('❌ Gagal update status tempat', 'error');
        }
        
    } catch (error) {
        console.error('Error approving place:', error);
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// E. Hapus Tempat
async function deletePlace(placeId) {
    if (!confirm('Yakin ingin menghapus tempat ini?')) return;
    
    try {
        const result = await API.deletePlace(placeId, adminToken);
        if (result.message) {
            showNotification('✅ ' + result.message, 'success');
            loadPlaces(); // Refresh list
        } else {
            showNotification('❌ Gagal menghapus tempat', 'error');
        }
    } catch (error) {
        showNotification('❌ Terjadi kesalahan', 'error');
    }
}

// --- 4. MANAJEMEN BOOKING ---

async function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;
    
    try {
        bookingsList.innerHTML = '<div class="loading">🔄 Memuat booking...</div>';
        allBookings = await API.getBookings();
        displayBookings(allBookings);
        updateStats();
        
    } catch (error) {
        bookingsList.innerHTML = '<div class="loading">❌ Gagal memuat booking</div>';
    }
}

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

// --- 5. HELPERS & UTILS ---

function updateStats() {
    document.getElementById('totalPlaces').textContent = allPlaces.length;
    document.getElementById('totalBookings').textContent = allBookings.length;
}

function updateTabState(activeTab) {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (activeTab === 'approved') tabs[0].classList.add('active');
    else tabs[1].classList.add('active');
}

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

// Export fungsi biar bisa diklik dari HTML (onclick="...")
window.editPlace = editPlace; 
window.deletePlace = deletePlace;
window.cancelEdit = cancelEdit;
window.loadBookings = loadBookings;
window.showApprovedPlaces = showApprovedPlaces;
window.showPendingPlaces = showPendingPlaces;
window.approvePlace = approvePlace;
window.logout = logout;
window.handlePlaceSubmit = handlePlaceSubmit;