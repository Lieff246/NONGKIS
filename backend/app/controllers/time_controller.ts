import type { HttpContext } from '@adonisjs/core/http'

export default class TimeController {
  async getPaluTime({ response }: HttpContext) {
    // Try TimeAPI.io (Primary Public API)
    try {
      console.log('🌍 Trying TimeAPI.io...')
      const apiResponse = await fetch('http://timeapi.io/api/Time/current/zone?timeZone=Asia/Makassar')
      
      if (apiResponse.ok) {
        const data = await apiResponse.json()
        const result = this.formatTimeAPIData(data)
        console.log('🌍 TimeAPI.io SUCCESS:', result.timeString)
        return response.json(result)
      } else {
        console.log('❌ TimeAPI.io HTTP Error:', apiResponse.status, apiResponse.statusText)
      }
    } catch (error) {
      console.log('⚠️ TimeAPI.io failed:', error.message)
    }
    
    console.log('🚨 WorldTimeAPI failed, using server fallback')
    
    // Fallback: use server time with WITA offset
    const now = new Date()
    const witaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // UTC+8 for WITA
    
    const result = {
      currentTime: witaTime,
      timeString: this.formatTime(witaTime),
      dateString: this.formatDate(witaTime),
      timezone: 'WITA (Fallback)',
      message: this.getTimeMessage(witaTime)
    }
    
    console.log('🕐 FALLBACK TIME:', result.timeString)
    console.log('🕐 JAM SEKARANG (WITA):', result.timeString.substring(0, 5))
    return response.json(result)
  }
  

  
  private formatTimeAPIData(data: any) {
    const dateTime = new Date(data.dateTime)
    
    return {
      currentTime: dateTime,
      timeString: this.formatTime(dateTime),
      dateString: this.formatDate(dateTime),
      timezone: 'WITA (TimeAPI.io)',
      message: this.getTimeMessage(dateTime)
    }
  }
  
  private formatTime(date: Date) {
    // Use consistent HH:MM:SS format
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
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