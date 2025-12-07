// Simple Notification System
class NotificationService {
    static showNotification(message, type = 'info', duration = 5000) {
        // Remove existing notification
        const existing = document.querySelector('.notification-popup');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-popup notification-${type}`;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            booking: '📅'
        };
        return icons[type] || 'ℹ️';
    }
    
    // Simple notification for booking updates
    static notifyBookingUpdate(bookingId, status, placeName) {
        const messages = {
            'admin_contacted_owner': `Admin sedang menghubungi owner untuk booking di ${placeName}`,
            'owner_approved': `Owner menyetujui booking Anda di ${placeName}!`,
            'owner_rejected': `Maaf, booking di ${placeName} ditolak owner`,
            'confirmed': `Booking di ${placeName} dikonfirmasi! Siap berangkat!`
        };
        
        const message = messages[status] || `Status booking diupdate: ${status}`;
        const type = status.includes('approved') || status === 'confirmed' ? 'success' : 
                    status.includes('rejected') ? 'error' : 'info';
        
        this.showNotification(message, type, 7000);
    }
    
    // Check for booking updates (simple polling)
    static startBookingNotifications(userId) {
        if (!userId) return;
        
        // Check every 30 seconds for booking updates
        setInterval(async () => {
            try {
                const bookings = await API.getBookings();
                const userBookings = bookings.filter(b => b.user === userId);
                
                // Check localStorage for last known status
                userBookings.forEach(booking => {
                    const lastStatus = localStorage.getItem(`booking_${booking._id}_status`);
                    
                    if (lastStatus && lastStatus !== booking.status) {
                        // Status changed, show notification
                        this.notifyBookingUpdate(booking._id, booking.status, booking.place?.name || 'Tempat');
                    }
                    
                    // Update stored status
                    localStorage.setItem(`booking_${booking._id}_status`, booking.status);
                });
                
            } catch (error) {
                console.log('Notification check failed:', error);
            }
        }, 30000); // 30 seconds
    }
}

// CSS for notifications (inject into page)
const notificationCSS = `
.notification-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
    border-left: 4px solid #007bff;
}

.notification-popup.notification-success {
    border-left-color: #28a745;
}

.notification-popup.notification-error {
    border-left-color: #dc3545;
}

.notification-popup.notification-warning {
    border-left-color: #ffc107;
}

.notification-content {
    display: flex;
    align-items: center;
    padding: 15px;
    gap: 10px;
}

.notification-icon {
    font-size: 18px;
}

.notification-message {
    flex: 1;
    font-size: 14px;
    color: #333;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 20px;
    height: 20px;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Export for global use
window.NotificationService = NotificationService;