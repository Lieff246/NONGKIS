// Global Variables
let currentUser = null;
let allPlaces = [];
let interactiveMap = null;
let currentView = "list"; // 'list' or 'map'

// Initialize App
document.addEventListener("DOMContentLoaded", function () {
  console.log("Page loaded, initializing...");
  checkLoginStatus();
  loadTime();
  loadPlaces();
  setupEventListeners();

  // Force navigation update after a short delay
  setTimeout(() => {
    console.log("Force updating navigation...");
    updateNavigation();

    // Start notifications for logged in users
    if (currentUser && currentUser.role === "user") {
      NotificationService.startBookingNotifications(currentUser.id);
    }
  }, 500);
});

// Check if user is logged in
function checkLoginStatus() {
  console.log("Checking login status...");
  const userData = localStorage.getItem("nongkis_user");
  const token = localStorage.getItem("nongkis_token");

  console.log("UserData from localStorage:", userData);
  console.log("Token from localStorage:", token ? "exists" : "not found");

  if (userData && token) {
    try {
      currentUser = JSON.parse(userData);
      console.log("User logged in:", currentUser.name, currentUser.role);
      updateNavigation();
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Clear invalid data
      localStorage.removeItem("nongkis_user");
      localStorage.removeItem("nongkis_token");
      currentUser = null;
      updateNavigation();
    }
  } else {
    console.log("No user data found, user not logged in");
    currentUser = null;
    updateNavigation();
  }
}

// Update navigation based on login status
function updateNavigation() {
  console.log("updateNavigation called, currentUser:", currentUser);
  const navMenu = document.getElementById("navMenu");
  console.log("navMenu element:", navMenu);
  if (!navMenu) {
    console.error("navMenu element not found!");
    return;
  }

  if (currentUser) {
    console.log("Updating nav for user:", currentUser.name, currentUser.role);
    if (currentUser.role === "admin") {
      navMenu.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="#tempat" class="nav-link">Tempat</a>
                <a href="admin-dashboard.html" class="nav-link">Admin</a>
                <a href="#" class="nav-link" onclick="logout()">Logout (${currentUser.name})</a>
            `;
    } else if (currentUser.role === "owner") {
      navMenu.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="#tempat" class="nav-link">Tempat</a>
                <a href="owner-dashboard.html" class="nav-link">Owner</a>
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
  } else {
    // Not logged in - show login/register links
    navMenu.innerHTML = `
            <a href="index.html" class="nav-link active">Beranda</a>
            <a href="#tempat" class="nav-link">Tempat</a>
            <a href="login.html" class="nav-link">Login</a>
            <a href="register.html" class="nav-link">Register</a>
        `;
  }

  // Refresh places display to show correct buttons
  if (allPlaces.length > 0) {
    displayPlaces(allPlaces);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterPlaces();
    });
  }

  // Category filter
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      filterPlaces();
    });
  }
}

// Load places from API
async function loadPlaces() {
  const placesList = document.getElementById("placesList");
  if (!placesList) return;

  try {
    placesList.innerHTML = '<div class="loading">🔄 Memuat tempat...</div>';

    allPlaces = await API.getPlaces();
    console.log("🔍 Loaded places:", allPlaces.length);
    console.log("🔍 Sample place:", allPlaces[0]);
    console.log("🔍 Categories found:", [
      ...new Set(allPlaces.map((p) => p.category)),
    ]);
    displayPlaces(allPlaces);

    // Force navigation update after loading places
    setTimeout(() => {
      updateNavigation();
    }, 100);
  } catch (error) {
    console.error("Error loading places:", error);
    placesList.innerHTML = '<div class="loading">❌ Gagal memuat tempat</div>';
  }
}

// Display places in grid
function displayPlaces(places) {
  const placesList = document.getElementById("placesList");
  if (!placesList) return;

  if (places.length === 0) {
    placesList.innerHTML =
      '<div class="loading">🔍 Tidak ada tempat ditemukan</div>';
    return;
  }

  placesList.innerHTML = places.map((place) => createPlaceCard(place)).join("");

  // Places loaded successfully
}

// Create place card HTML
function createPlaceCard(place) {
  const categoryIcon = getCategoryIcon(place.category);
  const imageUrl =
    place.image || "https://via.placeholder.com/300x200?text=Tempat+Nongkrong";

  // Status buka/tutup
  const isOpen = place.isOpen !== undefined ? place.isOpen : true;
  const openHours = place.openHours || "08:00";
  const closeHours = place.closeHours || "22:00";
  const statusBadge = isOpen
    ? `<span class="status-badge open">🟢 BUKA</span>`
    : `<span class="status-badge closed">🔴 TUTUP</span>`;

  return `
        <div class="place-card" data-place-id="${place._id}">
            <div class="place-image">
                <img src="${imageUrl}" alt="${
    place.name
  }" onerror="this.src='https://via.placeholder.com/300x200?text=Tempat+Nongkrong'">
                <div class="place-category">${categoryIcon} ${
    place.category || "nongkrong"
  }</div>
            </div>
            <div class="place-content">
                <h3>${place.name}</h3>
                <div class="place-info">
                    <p>📍 ${place.location}</p>
                    <p>📝 ${place.description}</p>
                    <p>👥 Kapasitas: ${place.capacity || 10} orang</p>
                    <p>🕐 Jam: ${openHours} - ${closeHours} ${statusBadge}</p>
                </div>
                <div class="place-actions">
                    ${
                      currentUser
                        ? isOpen
                          ? `<button onclick="bookPlace('${place._id}')" class="book-button">
                              📅 Booking Sekarang
                            </button>`
                          : `<button class="book-button" disabled style="opacity: 0.5; cursor: not-allowed;">
                              🔒 Tempat Tutup
                            </button>`
                        : `<button onclick="showLoginAlert()" class="login-button">
                            🔐 Login untuk Booking
                        </button>`
                    }
                    <button onclick="showRoute('${place._id}', '${
    place.location
  }')" class="nav-button">
                         Lihat Lokasi
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Filter places based on search and category
function filterPlaces() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const category = document.getElementById("categoryFilter")?.value || "";

  console.log("🔍 Filtering with:", { searchTerm, category });
  console.log("🔍 Total places:", allPlaces.length);

  let filteredPlaces = allPlaces;

  // Filter by search term
  if (searchTerm) {
    filteredPlaces = filteredPlaces.filter((place) => {
      const matchName = place.name.toLowerCase().includes(searchTerm);
      const matchLocation = place.location.toLowerCase().includes(searchTerm);
      const matchDescription = (place.description || "")
        .toLowerCase()
        .includes(searchTerm);

      return matchName || matchLocation || matchDescription;
    });
    console.log("🔍 After search filter:", filteredPlaces.length);
  }

  // Filter by category
  if (category) {
    filteredPlaces = filteredPlaces.filter((place) => {
      return place.category === category;
    });
    console.log("🔍 After category filter:", filteredPlaces.length);
  }

  console.log("🔍 Final filtered places:", filteredPlaces.length);
  displayPlaces(filteredPlaces);
}

// Book a place
async function bookPlace(placeId) {
  if (!currentUser) {
    showLoginAlert();
    return;
  }

  const place = allPlaces.find((p) => p._id === placeId);
  if (!place) return;

  // Create booking modal
  const modal = document.createElement("div");
  modal.className = "booking-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📅 Booking ${place.name}</h3>
                <button class="close-btn" onclick="closeBookingModal()">&times;</button>
            </div>
            <form id="bookingForm" class="booking-form">
                <div class="form-group">
                    <label>Nama Lengkap:</label>
                    <input type="text" id="customerName" value="${
                      currentUser.name
                    }" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="customerEmail" value="${
                      currentUser.email
                    }" required>
                </div>
                <div class="form-group">
                    <label>Jumlah Orang:</label>
                    <input type="number" id="capacity" min="1" max="${
                      place.capacity || 10
                    }" value="1" required>
                    <small>Maksimal ${place.capacity || 10} orang</small>
                </div>
                <div class="form-group">
                    <label>Tanggal:</label>
                    <input type="date" id="bookingDate" min="${
                      new Date().toISOString().split("T")[0]
                    }" required>
                </div>
                <div class="form-group">
                    <label>Waktu:</label>
                    <input type="time" id="bookingTime" value="10:00" required>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeBookingModal()" class="cancel-btn">Batal</button>
                    <button type="submit" class="submit-btn">📅 Booking Sekarang</button>
                </div>
            </form>
        </div>
    `;

  document.body.appendChild(modal);

  // Handle form submission
  document
    .getElementById("bookingForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = {
        placeId: placeId,
        customerName: document.getElementById("customerName").value,
        customerEmail: document.getElementById("customerEmail").value,
        capacity: document.getElementById("capacity").value,
        date: document.getElementById("bookingDate").value,
        time: document.getElementById("bookingTime").value,
      };

      try {
        const result = await API.createBooking(formData, currentUser.id);

        if (result.message) {
          showNotification("✅ " + result.message, "success");
          closeBookingModal();
        } else {
          showNotification("❌ Gagal membuat booking", "error");
        }
      } catch (error) {
        console.error("Booking error:", error);
        showNotification("❌ Terjadi kesalahan", "error");
      }
    });
}

// Show login alert
function showLoginAlert() {
  showNotification("🔐 Silakan login terlebih dahulu", "info");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 2000);
}

// Logout function
function logout() {
  localStorage.removeItem("nongkis_user");
  localStorage.removeItem("nongkis_token");
  currentUser = null;
  showNotification("👋 Logout berhasil!", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Show notification
function showNotification(message, type = "info") {
  // Remove existing notification
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// Load time data
async function loadTime() {
  const timeWidget = document.getElementById("timeWidget");
  const timeMessage = document.getElementById("timeMessage");

  if (!timeWidget) return;

  try {
    const timeData = await TimeService.getPaluTime();

    timeWidget.innerHTML = `
            <div class="time-info">
                <span class="time-icon">🕰️</span>
                <div class="time-details">
                    <span class="time-clock">${timeData.timeString}</span>
                    <span class="time-zone">${timeData.timezone}</span>
                </div>
                <span class="time-location">Palu</span>
            </div>
        `;

    if (timeMessage) {
      timeMessage.innerHTML = `
                <div class="time-message-content">
                    <span class="message-icon">💡</span>
                    <span class="message-text">${timeData.message}</span>
                </div>
            `;
    }

    // Update time every second
    setInterval(async () => {
      const newTimeData = await TimeService.getPaluTime();
      const clockElement = timeWidget.querySelector(".time-clock");
      if (clockElement) {
        clockElement.textContent = newTimeData.timeString;
      }
    }, 1000);
  } catch (error) {
    console.error("Error loading time:", error);
    timeWidget.innerHTML = `
            <div class="time-info">
                <span class="time-icon">🕰️</span>
                <div class="time-details">
                    <span class="time-clock">--:--:--</span>
                    <span class="time-zone">WITA</span>
                </div>
                <span class="time-location">Palu</span>
            </div>
        `;
  }
}

// Show place location
async function showRoute(placeId, placeAddress) {
  try {
    // Find place data from allPlaces
    const place = allPlaces.find((p) => p._id === placeId);
    if (!place) {
      showNotification("❌ Tempat tidak ditemukan", "error");
      return;
    }

    let placeCoordinates;

    // Prioritas: gunakan koordinat yang tersimpan
    if (
      place.coordinates &&
      place.coordinates.lat &&
      place.coordinates.lng &&
      place.coordinates.lat !== null &&
      place.coordinates.lng !== null
    ) {
      placeCoordinates = {
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
      };
    } else {
      // Parse koordinat dari location atau gunakan fallback
      const parseResult = MapsService.parseCoordinates(place.location);
      placeCoordinates = parseResult.coordinates;
    }

    // Langsung tampilkan peta
    showPlaceOnMap(place, placeCoordinates);
  } catch (error) {
    console.error("Location error:", error);
    showNotification("❌ Gagal memuat lokasi", "error");
  }
}

// Show list view
function showListView() {
  currentView = "list";
  document.getElementById("placesList").style.display = "grid";
  document.getElementById("placesMap").style.display = "none";

  // Update button states
  document.getElementById("listViewBtn").classList.add("active");
  document.getElementById("mapViewBtn").classList.remove("active");

  // Destroy map to save resources
  if (interactiveMap) {
    interactiveMap.destroy();
    interactiveMap = null;
  }
}

// Show map view
function showMapView() {
  currentView = "map";
  document.getElementById("placesList").style.display = "none";
  document.getElementById("placesMap").style.display = "block";

  // Update button states
  document.getElementById("listViewBtn").classList.remove("active");
  document.getElementById("mapViewBtn").classList.add("active");

  // Initialize interactive map
  setTimeout(() => {
    if (!interactiveMap) {
      interactiveMap = new InteractiveMaps();
      interactiveMap.initPlacesMap("mapContainer", allPlaces);
    }
  }, 100);
}

// Close booking modal
function closeBookingModal() {
  const modal = document.querySelector(".booking-modal");
  if (modal) {
    modal.remove();
  }
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    nongkrong: "🏖️",
    belajar: "📚",
    diskusi: "👥",
  };
  return icons[category] || "🏖️";
}

// Show place on Leaflet map
function showPlaceOnMap(place, placeCoordinates) {
  // Create modal with map
  const modal = document.createElement("div");
  modal.className = "booking-modal";
  modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>🗺️ Lokasi ${place.name}</h3>
                <button class="close-btn" onclick="closeMapModal()">&times;</button>
            </div>
            <div id="routeMapContainer" style="height: 400px; width: 100%; margin: 1rem 0;"></div>
            <div style="padding: 1rem; text-align: center;">
                <p><strong>📍 Alamat:</strong> ${place.location}</p>
                <p><strong>🌍 Koordinat:</strong> ${placeCoordinates.lat.toFixed(
                  6
                )}, ${placeCoordinates.lng.toFixed(6)}</p>
                <p><strong>👥 Kapasitas:</strong> ${
                  place.capacity || 10
                } orang</p>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Initialize Leaflet map
  setTimeout(() => {
    const map = L.map("routeMapContainer").setView(
      [placeCoordinates.lat, placeCoordinates.lng],
      15
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Add place marker
    L.marker([placeCoordinates.lat, placeCoordinates.lng])
      .addTo(map)
      .bindPopup(
        `
                <div style="text-align: center;">
                    <h4>🎯 ${place.name}</h4>
                    <p>📍 ${place.location}</p>
                    <p>👥 ${place.capacity || 10} orang</p>
                    <p>🏷️ ${place.category}</p>
                </div>
            `
      )
      .openPopup();
  }, 100);
}

// Close map modal
function closeMapModal() {
  const modal = document.querySelector(".booking-modal");
  if (modal) {
    modal.remove();
  }
}

// Export functions for global use
window.bookPlace = bookPlace;
window.closeBookingModal = closeBookingModal;
window.showPlaceOnMap = showPlaceOnMap;
window.closeMapModal = closeMapModal;
window.logout = logout;
window.showLoginAlert = showLoginAlert;
window.loadTime = loadTime;
window.showRoute = showRoute;
window.showListView = showListView;
window.showMapView = showMapView;
