import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/users'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const { name, email, password } = request.only(['name', 'email', 'password'])

      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return response.conflict({ message: 'Email already registered' })
      }

      // Create user with bcrypt hashed password
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log('🔍 REGISTER - Password:', password)
      console.log('🔍 REGISTER - Hashed:', hashedPassword)

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
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

      // SIMPLE DEBUG
      console.log('🔍 LOGIN: ', email, password)

      // Find user by email
      const user = await User.findOne({ email })
      console.log('🔍 USER FOUND: ', user ? 'YES' : 'NO')

      if (!user) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      // SIMPLE DEBUG
      console.log('🔍 STORED PASSWORD: ', user.password)
      console.log('🔍 PASSWORD LENGTH: ', user.password?.length)

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password as string)
      console.log('🔍 PASSWORD VALID: ', isValidPassword)

      if (!isValidPassword) {
        return response.unauthorized({ message: 'Invalid credentials' })
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return response.ok({
          message: 'Login successful',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        })
      }

      // Generate JWT token only for admin
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
        message: 'Admin login successful',
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      console.log('❌ LOGIN ERROR: ', error)
      return response.internalServerError({
        message: 'Login failed',
      })
    }
  }

  async createAdmin({ request, response }: HttpContext) {
    try {
      const { name, email, password } = request.only(['name', 'email', 'password'])

      // Check if admin already exists
      const existingAdmin = await User.findOne({ email })
      if (existingAdmin) {
        return response.conflict({ message: 'Admin already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
      })

      return response.created({
        message: 'Admin created successfully',
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create admin',
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
