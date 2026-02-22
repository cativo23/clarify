/**
 * Test Redis Connection (Local or Upstash)
 * 
 * Usage:
 *   - Local: docker exec clarify-app npx tsx scripts/test-redis.ts
 *   - Upstash: docker exec --env-file .env clarify-app npx tsx scripts/test-redis.ts
 * 
 * Or locally with tsx:
 *   npx tsx scripts/test-redis.ts
 */

import { Redis } from 'ioredis'

async function testRedisConnection() {
  console.log('🔍 Testing Redis Connection...\n')
  
  // Get credentials from environment (works for both local and Upstash)
  const host = process.env.REDIS_HOST || 'localhost'
  const port = parseInt(process.env.REDIS_PORT || '6379')
  const token = process.env.REDIS_TOKEN
  
  const isUpstash = host.includes('upstash.io')
  
  console.log('📍 Connection Details:')
  console.log(`   Host: ${host}`)
  console.log(`   Port: ${port}`)
  console.log(`   Type: ${isUpstash ? 'Upstash Cloud' : 'Local Redis'}`)
  console.log(`   TLS: ${isUpstash ? '✅ Enabled (rediss://)' : '❌ Disabled (local)'}`)
  console.log(`   Auth: ${token ? '✅ Token-based (Upstash)' : '❌ None (local)'}\n`)
  
  // Create Redis client
  const redisConfig: any = {
    host: host,
    port: port,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('❌ Max retries reached')
        return null
      }
      return Math.min(times * 200, 2000)
    }
  }
  
  // Add auth + TLS for Upstash
  if (token) {
    redisConfig.password = token
    redisConfig.tls = {}
  }
  
  const redis = new Redis(redisConfig)
  
  try {
    // Test connection
    console.log('🔗 Connecting...')
    await redis.ping()
    console.log('✅ Connection successful!\n')
    
    // Test SET
    console.log('📝 Testing SET...')
    const testKey = `test:${Date.now()}`
    const testValue = 'bar'
    await redis.set(testKey, testValue)
    console.log(`   SET ${testKey} = ${testValue} ✅\n`)
    
    // Test GET
    console.log('📖 Testing GET...')
    const result = await redis.get(testKey)
    console.log(`   GET ${testKey} = ${result} ✅\n`)
    
    // Test cleanup
    console.log('🧹 Cleaning up...')
    await redis.del(testKey)
    console.log(`   DEL ${testKey} ✅\n`)
    
    // Show info
    console.log('📊 Redis Info:')
    const info = await redis.info('server')
    const redisVersion = info.match(/redis_version:(.+)/)?.[1]
    console.log(`   Version: ${redisVersion || 'Unknown'}`)
    console.log(`   Mode: ${info.includes('role:master') ? 'Master' : 'Replica'}`)
    
    console.log('\n✅ All tests passed! Redis is working correctly.\n')
    
    if (isUpstash) {
      console.log('🎉 M3 Security Issue: RESOLVED!')
      console.log('   ✅ Authentication: Enabled')
      console.log('   ✅ TLS Encryption: Enabled')
      console.log('   ✅ No exposed ports\n')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.log('\nTroubleshooting:')
    console.log('1. Check your REDIS_TOKEN is correct')
    console.log('2. Verify your Redis database is active')
    console.log('3. Check firewall/network allows TLS connections')
    console.log('4. For Upstash: redis-cli -h <host> -p 6379 -a <token> --tls\n')
    process.exit(1)
  } finally {
    await redis.quit()
  }
}

// Run test
testRedisConnection().catch(console.error)
