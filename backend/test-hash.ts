import bcrypt from 'bcrypt'
import hash from '@adonisjs/core/services/hash'

async function testHash() {
  const password = '123'
  
  console.log('=== TESTING HASH METHODS ===')
  
  // Test AdonisJS hash service
  const adonisHash = await hash.make(password)
  console.log('AdonisJS Hash:', adonisHash)
  console.log('AdonisJS Verify:', await hash.verify(password, adonisHash))
  
  // Test direct bcrypt
  const bcryptHash = await bcrypt.hash(password, 10)
  console.log('Direct bcrypt Hash:', bcryptHash)
  console.log('Direct bcrypt Verify:', await bcrypt.compare(password, bcryptHash))
  
  // Cross verify
  console.log('AdonisJS verify bcrypt hash:', await hash.verify(password, bcryptHash))
  console.log('bcrypt verify AdonisJS hash:', await bcrypt.compare(password, adonisHash))
}

testHash().catch(console.error)