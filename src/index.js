'use strict'

const kv = require('./kv-secrets.js')
const restify = require('restify')

const secretsCache = {
  timestamp: Math.floor(new Date() / 1000)
}

// Filter out the name and value from the secret object
function filterSecrets (secrets) {
  const res = {}
  for (const secret of secrets) {
    res[secret.name] = secret.value
  }
  return res
}

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0)
  })
})

// Check if the cache is still valid.
// If it's expired, refresh it, otherwise do nothing.
async function updateSecrets (ttl = 20) { // default 600 seconds, 10 minutes
  const currentTime = Math.floor(new Date() / 1000)
  console.info(`cache ttl: ${ttl - (currentTime - secretsCache.timestamp)}`)
  if (typeof secretsCache.secrets === 'undefined' || (currentTime - secretsCache.timestamp) >= ttl) {
    console.warn('refreshing cache. waiting ...')
    secretsCache.secrets = await kv.getAllSecrets()
    secretsCache.timestamp = currentTime
  }
}

// REST Server definitions

const port = '9500'
const server = restify.createServer({
  name: 'KeyHandler',
  version: '2.0.0',
  url: 'localhost'
  // certificate: cert,
  // key: key
})

let hits = 0

server.pre(restify.plugins.pre.dedupeSlashes())
server.pre((req, res, next) => {
  console.log(`incoming request ${++hits} to ${req.toString()}`)
  next()
})

server.get('/_status', (req, res, next) => {
  res.send('OK')
  next()
})

server.get('/allsecrets',
  async (req, res, next) => {
    await updateSecrets()
    res.send(filterSecrets(secretsCache.secrets))
    next()
  })

server.listen(port, () => {
  console.log(`${server.name} listening at ${server.url}`)
})
