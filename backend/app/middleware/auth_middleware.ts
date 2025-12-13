import type { HttpContext } from '@adonisjs/core/http'
import jwt from 'jsonwebtoken'

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    const authHeader = request.header('Authorization')
    // Memastikan request mempunyai header bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Bearer token required' })
    }

    const token = authHeader.replace('Bearer ', '').replace(/"/g, '')

    try {
      const decoded = jwt.verify(token, 'your-secret-key') as any
      ;(request as any).userId = decoded.id
      await next()
    } catch (error) {
      return response.status(401).json({ message: 'Invalid token' })
    }
  }
}
