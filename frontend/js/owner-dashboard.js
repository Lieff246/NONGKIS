// Owner Dashboard JavaScript - SIMPLE VERSION
let currentOwner = null;

// Initialize owner dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkOwnerAuth();
    loadOwnerInfo();
});

// Check if user is authenticated as owner
function checkOwnerAuth() {
    const userData = localStorage.getItem('nongkis_user');
    const token = localStorage.getItem('nongkis_token');
    
    console.log('🔍 Owner auth check:', { userData: !!userData, token: !!token });
    
    if (!userData) {
        alert('❌ Silakan login terlebih dahulu');
        window.location.href = 'login.html';
        return;
    }
    
    if (!token) {
        alert('❌ Token tidak ditemukan. Silakan login ulang.');
        localStorage.removeItem('nongkis_user');
        window.location.href = 'login.html';
        return;
    }
    
    currentOwner = JSON.parse(userData);
    console.log('🔍 Current owner:', currentOwner);
    
    // Check if user is actually an owner
    if (currentOwner.role !== 'owner') {
        alert('❌ Akses ditolak! Hanya untuk owner.');
        if (currentOwner.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }
}

// Load owner information
function loadOwnerInfo() {
    if (!currentOwner) return;
    
    document.getElementById('ownerName').textContent = currentOwner.name;
    document.getElementById('infoName').textContent = currentOwner.name;
    document.getElementById('infoEmail').textContent = currentOwner.email;
    document.getElementById('infoRole').textContent = currentOwner.role;
}

// Show add place form
function showAddPlace() {
    const ownerContent = document.getElementById('ownerPlaces');
    ownerContent.innerHTML = `
        <div class="place-form">
            <h4>➕ Tambah Tempat Baru</h4>
            <form id="addPlaceForm">
                <div class="form-group">
                    <label>Nama Tempat</label>
                    <input type="text" id="placeName" required placeholder="Contoh: Cafe Keren">
                </div>
                <div class="form-group">
                    <label>Lokasi/Alamat</label>
                    <input type="text" id="placeLocation" required placeholder="Jl. Diponegoro No. 123, Palu">
                    <small>Masukkan alamat atau klik di peta untuk memilih lokasi</small>
                    <div class="location-actions">
                        <button type="button" onclick="previewLocation()" class="preview-btn">📍 Preview Lokasi</button>
                        <button type="button" onclick="toggleLocationMap()" class="map-btn">🗺️ Pilih di Peta</button>
                    </div>
                    <div id="locationPreview" class="location-preview"></div>
                    <div id="locationMapContainer" class="location-map" style="display: none;">
                        <div id="ownerMapContainer" style="height: 300px; width: 100%; margin-top: 10px; border-radius: 5px;"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="placeCategory" required>
                        <option value="nongkrong">🏖️ Nongkrong</option>
                        <option value="belajar">📚 Belajar</option>
                        <option value="diskusi">👥 Diskusi</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Kapasitas (orang)</label>
                    <input type="number" id="placeCapacity" required min="1" value="10">
                </div>
                <div class="form-group">
                    <label>Deskripsi</label>
                    <textarea id="placeDescription" rows="3" placeholder="Deskripsikan tempat Anda..."></textarea>
                </div>
                <div class="form-group">
                    <label>Gambar Tempat</label>
                    <input type="file" id="placeImageFile" accept="image/*">
                    <small>Pilih gambar dari laptop (JPG, PNG, max 2MB)</small>
                    <div id="imagePreview" style="margin-top: 10px; display: none;">
                        <img id="previewImg" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 1px solid #ddd;">
                    </div>
                </div>
                <button type="submit" class="auth-button">📤 Submit untuk Approval</button>
                <button type="button" class="auth-button" onclick="showMyPlaces()" style="background:#6c757d; margin-left:10px;">❌ Batal</button>
            </form>
        </div>
    `;
    
    // Handle form submission
    document.getElementById('addPlaceForm').addEventListener('submit', handleAddPlace);
    
    // Handle image preview
    document.getElementById('placeImageFile').addEventListener('change', handleImagePreview);
}

async function showMyPlaces() {
    const ownerContent = document.getElementById('ownerPlaces');
    ownerContent.innerHTML = '<div class="loading">🔄 Memuat tempat Anda...</div>';
    
    try {
        // Get all places and filter by owner_id
        const response = await fetch('http://localhost:3333/places/all'); // No token needed
        
        if (response.ok) {
            const allPlaces = await response.json();
            console.log('🔍 All places:', allPlaces);
            console.log('🔍 Current owner ID:', currentOwner.id);
            
            // Filter places by owner_id - handle both populated and non-populated cases
            const ownerPlaces = allPlaces.filter(place => {
                const ownerId = place.owner_id?._id || place.owner_id;
                return ownerId === currentOwner.id;
            });
            
            console.log('🔍 Owner places:', ownerPlaces);
            
            if (ownerPlaces.length === 0) {
                ownerContent.innerHTML = '<div class="no-data">Belum ada tempat yang ditambahkan</div>';
            } else {
                ownerContent.innerHTML = ownerPlaces.map(place => {
                    const imageUrl = place.image || 'https://via.placeholder.com/300x200?text=Tempat+Nongkrong';
                    return `
                        <div class="place-card" style="border-left: 4px solid ${place.status === 'approved' ? '#28a745' : place.status === 'pending' ? '#ffc107' : '#dc3545'};">
                            <div class="place-image" style="height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                                <img src="${imageUrl}" alt="${place.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Tempat+Nongkrong'">
                            </div>
                            <div class="place-content">
                                <h3>${place.name} <span style="color:${place.status === 'approved' ? '#28a745' : place.status === 'pending' ? '#ffc107' : '#dc3545'}; font-size:0.8em;">[${place.status.toUpperCase()}]</span></h3>
                                <div class="place-info">
                                    <p>📍 ${place.location}</p>
                                    <p>📝 ${place.description || 'Tidak ada deskripsi'}</p>
                                    <p>🏷️ ${place.category}</p>
                                    <p>👥 ${place.capacity} orang</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            ownerContent.innerHTML = '<div class="no-data">Gagal memuat tempat</div>';
        }
    } catch (error) {
        console.error('Error loading owner places:', error);
        ownerContent.innerHTML = '<div class="no-data">Belum ada tempat yang ditambahkan</div>';
    }
}

async function showBookings() {
    const ownerContent = document.getElementById('ownerPlaces');
    ownerContent.innerHTML = '<div class="loading">🔄 Memuat booking...</div>';
    
    try {
        // Gunakan API baru untuk owner booking
        const ownerBookings = await API.getOwnerBookings(currentOwner.id);
        
        if (ownerBookings.length === 0) {
            ownerContent.innerHTML = '<div class="no-data">Belum ada booking di tempat Anda</div>';
            return;
        }
        
        ownerContent.innerHTML = `
            <div class="booking-management">
                <h4>📅 Booking Masuk</h4>
                <div class="bookings-container">
                    ${ownerBookings.map(booking => `
                        <div class="booking-card">
                            <div class="booking-header">
                                <h4>📍 ${booking.place?.name || 'Tempat'}</h4>
                                <span class="booking-status ${booking.status}">${getStatusText(booking.status)}</span>
                            </div>
                            <div class="booking-info">
                                <p><strong>👤 Customer:</strong> ${booking.customerName}</p>
                                <p><strong>📧 Email:</strong> ${booking.customerEmail}</p>
                                <p><strong>👥 Jumlah:</strong> ${booking.capacity || 1} orang</p>
                                <p><strong>📅 Tanggal:</strong> ${booking.date}</p>
                                <p><strong>⏰ Waktu:</strong> ${booking.time}</p>
                            </div>
                            ${booking.status === 'pending' ? `
                                <div class="booking-actions">
                                    <button onclick="updateBookingStatus('${booking._id}', 'approved')" class="book-button">
                                        ✅ Terima
                                    </button>
                                    <button onclick="updateBookingStatus('${booking._id}', 'rejected')" class="btn-delete">
                                        ❌ Tolak
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        ownerContent.innerHTML = '<div class="no-data">❌ Gagal memuat booking</div>';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('nongkis_user');
    localStorage.removeItem('nongkis_token');
    alert('👋 Logout berhasil!');
    window.location.href = 'index.html';
}

// Show notification function - SAMA seperti yang lain
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

// Handle add place form submission
async function handleAddPlace(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = '🔄 Mengirim...';
        submitBtn.disabled = true;
        
        // Handle image file
        const imageFile = document.getElementById('placeImageFile').files[0];
        let imageData = null;
        
        if (imageFile) {
            try {
                imageData = await convertImageToBase64(imageFile);
            } catch (error) {
                showNotification('❌ Gagal memproses gambar', 'error');
                return;
            }
        }
        
        const placeData = {
            name: document.getElementById('placeName').value,
            location: document.getElementById('placeLocation').value,
            category: document.getElementById('placeCategory').value,
            capacity: parseInt(document.getElementById('placeCapacity').value),
            description: document.getElementById('placeDescription').value,
            image: imageData,
            owner_id: currentOwner.id
        };
        
        console.log('🔍 Sending place data:', placeData);
        
        // Call API tanpa token
        const response = await fetch('http://localhost:3333/places', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(placeData)
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        const result = await response.json();
        console.log('🔍 API Response:', result);
        
        if (response.ok) {
            showNotification('✅ ' + result.message, 'success');
            event.target.reset();
            showMyPlaces();
        } else {
            console.error('❌ API Error:', result);
            showNotification('❌ ' + (result.message || `Error ${response.status}: Gagal menambah tempat`), 'error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('❌ Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Preview location for owner
async function previewLocation() {
    const locationInput = document.getElementById('placeLocation');
    const previewDiv = document.getElementById('locationPreview');
    
    if (!locationInput.value.trim()) {
        showNotification('⚠️ Masukkan alamat terlebih dahulu', 'warning');
        return;
    }
    
    try {
        previewDiv.innerHTML = '🔄 Mencari lokasi...';
        
        const result = await MapsService.geocodeAddress(locationInput.value);
        
        if (result.found) {
            previewDiv.innerHTML = `
                <div class="location-found">
                    ✅ <strong>Lokasi ditemukan!</strong><br>
                    📍 ${result.display_name}<br>
                    🌍 Koordinat: ${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}
                </div>
            `;
        } else {
            previewDiv.innerHTML = `
                <div class="location-fallback">
                    ⚠️ <strong>Lokasi tidak ditemukan secara spesifik</strong><br>
                    Akan menggunakan koordinat pusat Palu sebagai fallback.<br>
                    <small>Pastikan alamat sudah benar dan lengkap.</small>
                </div>
            `;
        }
        
    } catch (error) {
        previewDiv.innerHTML = `
            <div class="location-error">
                ❌ Gagal mencari lokasi: ${error.message}
            </div>
        `;
    }
}

// Toggle location map
let ownerMap = null;
let selectedCoordinates = null;

function toggleLocationMap() {
    const mapContainer = document.getElementById('locationMapContainer');
    
    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        
        // Initialize map
        setTimeout(() => {
            if (!ownerMap) {
                ownerMap = new InteractiveMaps();
                ownerMap.initOwnerMap('ownerMapContainer', (lat, lng) => {
                    selectedCoordinates = { lat, lng };
                    
                    // Update location input with coordinates
                    document.getElementById('placeLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    
                    // Show preview
                    document.getElementById('locationPreview').innerHTML = `
                        <div class="location-found">
                            ✅ <strong>Lokasi dipilih dari peta!</strong><br>
                            📍 Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
                            <small>Anda dapat mengedit alamat di atas untuk deskripsi yang lebih jelas</small>
                        </div>
                    `;
                });
            }
        }, 100);
    } else {
        mapContainer.style.display = 'none';
        if (ownerMap) {
            ownerMap.destroy();
            ownerMap = null;
        }
    }
}

// Update booking status (owner)
async function updateBookingStatus(bookingId, status) {
    const token = localStorage.getItem('nongkis_token');
    
    if (!token) {
        showNotification('❌ Token tidak ditemukan. Silakan login ulang.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('🔍 Updating booking status:', { bookingId, status, token: token.substring(0, 20) + '...' });
    
    try {
        const result = await API.updateBookingStatus(bookingId, status, token);
        console.log('🔍 Update result:', result);
        
        if (result.message) {
            const statusText = status === 'approved' ? 'diterima' : 'ditolak';
            showNotification(`✅ Booking berhasil ${statusText}!`, 'success');
            showBookings(); // Refresh booking list
        } else {
            console.error('❌ API Error:', result);
            showNotification('❌ ' + (result.message || 'Gagal update status booking'), 'error');
        }
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        showNotification('❌ Terjadi kesalahan: ' + error.message, 'error');
    }
}

// Helper function for status text
function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Menunggu',
        'approved': '✅ Diterima',
        'rejected': '❌ Ditolak'
    };
    return statusMap[status] || status;
}

// Handle image preview
function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('⚠️ Ukuran gambar terlalu besar (max 2MB)', 'error');
            event.target.value = '';
            preview.style.display = 'none';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showNotification('⚠️ File harus berupa gambar', 'error');
            event.target.value = '';
            preview.style.display = 'none';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Compress and convert image to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Resize image (max width/height 400px)
            const maxSize = 400;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw compressed image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with compression (0.7 quality)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedBase64);
        };
        
        img.onerror = reject;
        
        // Load original image
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Export functions
window.showAddPlace = showAddPlace;
window.showMyPlaces = showMyPlaces;
window.showBookings = showBookings;
window.updateBookingStatus = updateBookingStatus;
window.logout = logout;
window.previewLocation = previewLocation;
window.toggleLocationMap = toggleLocationMap;