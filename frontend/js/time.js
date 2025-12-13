// Time API Integration - WorldTimeAPI (Free, no API key needed)
class TimeService {
    static async getPaluTime() {
        try {
            // Get Palu time from backend (uses WorldTimeAPI)
            const response = await fetch('/time/palu');
            
            if (!response.ok) {
                throw new Error('WorldTimeAPI failed');
            }
            
            const data = await response.json();
            console.log('🌍 WorldTimeAPI Response:', data);
            return data; // Backend already formats WorldTimeAPI data
            
        } catch (error) {
            console.error('WorldTimeAPI Error:', error);
            // Fallback to local time
            return this.formatTimeData({ datetime: new Date().toISOString() });
        }
    }
    
    static formatTimeData(data) {
        const dateTime = new Date(data.datetime);
        
        return {
            currentTime: dateTime,
            timeString: this.formatTime(dateTime),
            dateString: this.formatDate(dateTime),
            timezone: 'WITA',
            message: this.getTimeMessage(dateTime)
        };
    }
    
    static formatTime(date) {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Makassar'
        });
    }
    
    static formatDate(date) {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Makassar'
        });
    }
    
    static getTimeMessage(date) {
        const hour = date.getHours();
        
        if (hour >= 5 && hour < 12) {
            return 'Selamat pagi! Waktu yang tepat untuk nongkrong pagi 🌅';
        } else if (hour >= 12 && hour < 15) {
            return 'Selamat siang! Perfect untuk lunch break ☀️';
        } else if (hour >= 15 && hour < 18) {
            return 'Selamat sore! Waktu nongkrong santai 🌇';
        } else if (hour >= 18 && hour < 22) {
            return 'Selamat malam! Waktu hangout bareng teman 🌙';
        } else {
            return 'Malam yang tenang, cocok untuk tempat yang cozy 🌃';
        }
    }
    
    // Calculate booking expiry time (30 minutes from now)
    static getBookingExpiryTime(currentTime = new Date()) {
        const expiryTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // 30 minutes
        return expiryTime;
    }
    
    // Check if booking has expired
    static isBookingExpired(expiryTime) {
        return new Date() > new Date(expiryTime);
    }
    
    // Format countdown timer
    static getCountdownString(expiryTime) {
        const now = new Date();
        const timeLeft = new Date(expiryTime) - now;
        
        if (timeLeft <= 0) {
            return 'Expired';
        }
        
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Export for global use
window.TimeService = TimeService;