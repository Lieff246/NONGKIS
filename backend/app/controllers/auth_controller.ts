import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/users'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const { name, email, password, role } = request.only(['name', 'email', 'password', 'role'])

      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return response.conflict({ message: 'Email already registered' })
      }

      // Create user with bcrypt hashed password
      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user', // Use provided role or default to 'user'
      })

      return response.created({
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Registration failed',
      })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password as string)

      if (!isValidPassword) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      // Generate JWT token for all users
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        'your-secret-key',
        { expiresIn: '24h' }
      )

      return response.ok({
        message: 'Login successful',
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Login failed',
      })
    }
  }



  // Get user profile
  async profile({ request, response }: HttpContext) {
    try {
      const authHeader = request.header('Authorization')
      if (!authHeader) {
        return response.status(401).json({ message: 'Authorization header required' })
      }

      const token = authHeader.replace('Bearer ', '').replace(/"/g, '')
      const decoded = jwt.verify(token, 'your-secret-key') as any

      const user = await User.findById(decoded.id)
      if (!user) {
        return response.notFound({ message: 'User not found' })
      }

      return response.ok({
        message: 'Profile data retrieved successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      })
    } catch (error) {
      return response.status(401).json({ message: 'Invalid token' })
    }
  }
}
