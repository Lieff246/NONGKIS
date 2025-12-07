// Dashboard JavaScript
let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadUserBookings();
});

// Check if user is authenticated
function checkAuth() {
    const userData = localStorage.getItem('nongkis_user');
    const token = localStorage.getItem('nongkis_token');
    
    if (!userData) {
        alert('❌ Silakan login terlebih dahulu');
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // If admin, redirect to admin dashboard
    if (currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    }
}

// Load user information
function loadUserInfo() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('infoName').textContent = currentUser.name;
    document.getElementById('infoEmail').textContent = currentUser.email;
    document.getElementById('infoRole').textContent = currentUser.role;
}

// Load user bookings
async function loadUserBookings() {
    const bookingsContainer = document.getElementById('userBookings');
    if (!bookingsContainer) return;
    
    try {
        bookingsContainer.innerHTML = '<div class="loading">🔄 Memuat booking...</div>';
        
        const bookings = await API.getBookings();
        
        // Filter bookings for current user (since API returns all bookings)
        const userBookings = bookings.filter(booking => 
            booking.customerEmail === currentUser.email
        );
        
        if (userBookings.length === 0) {
            bookingsContainer.innerHTML = '<div class="no-data">Belum ada booking</div>';
            return;
        }
        
        bookingsContainer.innerHTML = userBookings.map(booking => {
            const statusText = getStatusText(booking.status || 'pending');
            const statusClass = getStatusClass(booking.status || 'pending');
            
            return `
                <div class="booking-card">
                    <div class="booking-header">
                        <h4>${booking.place?.name || 'Tempat'}</h4>
                        <span class="booking-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="booking-info">
                        <p><strong>Tanggal:</strong> ${booking.date}</p>
                        <p><strong>Waktu:</strong> ${booking.time}</p>
                        <p><strong>Nama:</strong> ${booking.customerName}</p>
                        <p><strong>Email:</strong> ${booking.customerEmail}</p>
                        ${booking.capacity ? `<p><strong>Jumlah Orang:</strong> ${booking.capacity}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsContainer.innerHTML = '<div class="no-data">❌ Gagal memuat booking</div>';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('nongkis_user');
    localStorage.removeItem('nongkis_token');
    alert('👋 Logout berhasil!');
    window.location.href = 'index.html';
}

// Helper functions for booking status
function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Menunggu Owner',
        'approved': '✅ Disetujui',
        'rejected': '❌ Ditolak'
    };
    return statusMap[status] || '⏳ Pending';
}

function getStatusClass(status) {
    const classMap = {
        'pending': 'pending',
        'approved': 'approved',
        'rejected': 'rejected'
    };
    return classMap[status] || 'pending';
}

// Export functions
window.loadUserBookings = loadUserBookings;
window.logout = logout;