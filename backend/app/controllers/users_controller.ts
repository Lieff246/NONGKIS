import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/users'
import hash from '@adonisjs/core/services/hash'

export default class UsersController {
  async index() {
    const users = await User.find()
    return users
  }
  async show({ params, response }: HttpContext) {
    const user = await User.findById(params.id)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }
    return user
  }

  async update({ params, request, response }: HttpContext) {
    const data = request.only(['name', 'email', 'password'])

    if (data.password) {
      data.password = await hash.make(data.password)
    }

    const user = await User.findByIdAndUpdate(params.id, data, { new: true })

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    return response.ok(user)
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findByIdAndDelete(params.id)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }
    return response.ok({ message: 'User deleted successfully' })
  }
}
