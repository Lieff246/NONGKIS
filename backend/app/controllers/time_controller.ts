import type { HttpContext } from '@adonisjs/core/http'

export default class TimeController {
  async getPaluTime({ response }: HttpContext) {
    try {
      // Try WorldTimeAPI first
      const apiResponse = await fetch('https://worldtimeapi.org/api/timezone/Asia/Makassar')
      
      if (apiResponse.ok) {
        const data = await apiResponse.json()
        return response.json(this.formatTimeData(data))
      }
    } catch (error) {
      // API failed, use fallback
    }
    
    // Fallback: use server time with WITA offset
    const now = new Date()
    const witaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // UTC+8 for WITA
    
    return response.json(this.formatTimeData({ datetime: witaTime.toISOString() }))
  }
  
  private formatTimeData(data: any) {
    const dateTime = new Date(data.datetime)
    
    return {
      currentTime: dateTime,
      timeString: this.formatTime(dateTime),
      dateString: this.formatDate(dateTime),
      timezone: 'WITA',
      message: this.getTimeMessage(dateTime)
    }
  }
  
  private formatTime(date: Date) {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Makassar'
    })
  }
  
  private formatDate(date: Date) {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Makassar'
    })
  }
  
  private getTimeMessage(date: Date) {
    const hour = date.getHours()
    
    if (hour >= 5 && hour < 12) {
      return 'Selamat pagi! Waktu yang tepat untuk nongkrong pagi 🌅'
    } else if (hour >= 12 && hour < 15) {
      return 'Selamat siang! Perfect untuk lunch break ☀️'
    } else if (hour >= 15 && hour < 18) {
      return 'Selamat sore! Waktu nongkrong santai 🌇'
    } else if (hour >= 18 && hour < 22) {
      return 'Selamat malam! Waktu hangout bareng teman 🌙'
    } else {
      return 'Malam yang tenang, cocok untuk tempat yang cozy 🌃'
    }
  }
}