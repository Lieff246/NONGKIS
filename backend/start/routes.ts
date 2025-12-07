/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const PlacesController = () => import('#controllers/places_controller')
const BookingsController = () => import('#controllers/bookings_controller')
const TimeController = () => import('#controllers/time_controller')
const MapsController = () => import('#controllers/maps_controller')

// Simple auth middleware
const authMiddleware = async ({ request, response }: any, next: any) => {
  const authHeader = request.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Bearer token required' })
  }
  const token = authHeader.replace('Bearer ', '').replace(/"/g, '')
  try {
    const jwt = await import('jsonwebtoken')
    jwt.default.verify(token, 'your-secret-key')
    await next()
  } catch (error) {
    return response.status(401).json({ message: 'Invalid token' })
  }
}

// Auth routes (public)
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])

router.get('/auth/profile', [AuthController, 'profile']).middleware(authMiddleware)

// User routes
router.get('/users', [UsersController, 'index'])
router.get('/users/:id', [UsersController, 'show'])
router.put('/users/:id', [UsersController, 'update']).middleware(authMiddleware)
router.delete('/users/:id', [UsersController, 'destroy']).middleware(authMiddleware)

// Place routes
router.get('/places', [PlacesController, 'index'])
router.get('/places/pending', [PlacesController, 'pending']).middleware(authMiddleware)
router.get('/places/all', [PlacesController, 'all']) // New route for owner to see all their places
router.get('/places/:id', [PlacesController, 'show'])
router.post('/places', [PlacesController, 'store']) // Owner can submit without token
router.put('/places/:id', [PlacesController, 'update']).middleware(authMiddleware)
router.put('/places/:id/approve', [PlacesController, 'approve']).middleware(authMiddleware)
router.delete('/places/:id', [PlacesController, 'destroy']).middleware(authMiddleware)

// Booking routes
router.get('/bookings', [BookingsController, 'index'])
router.get('/bookings/owner/:ownerId', [BookingsController, 'getOwnerBookings'])
router.post('/bookings', [BookingsController, 'store']) // Public booking
router.put('/bookings/:id/status', [BookingsController, 'updateStatus']).middleware(authMiddleware)
router.delete('/bookings/:id', [BookingsController, 'destroy']).middleware(authMiddleware)

// Time routes
router.get('/time/palu', [TimeController, 'getPaluTime'])

// Maps routes
router.get('/maps/geocode/:address', [MapsController, 'geocode'])
router.get('/maps/route', [MapsController, 'getRoute'])
