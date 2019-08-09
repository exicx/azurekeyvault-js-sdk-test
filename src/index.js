'use strict'

const kv = require('./kv-secrets.js')

// Format the secret object into a JSON string for returning to console or consumers
function stringifySecret (secret) {
  const res = {}
  res[secret.name] = secret.value
  return JSON.stringify(res)
}

// Format the array of secret objects into a JSON string for returning to console or consumers
function stringifySecrets (secrets) {
  const res = {}
  for (const secret of secrets) {
    res[secret.name] = secret.value
  }
  return JSON.stringify(res)
}

async function start () {
  // Tests getting a global vault secret
  await kv.getSecret('datadog-apiKey')
    .then((secret) => {
      console.log(stringifySecret(secret))
    })
    .catch((error) => {
      console.log(`${error}`)
    })

  // Tests getting a local vault secret
  await kv.getSecret('auth-jwtSecret')
    .then((secret) => {
      console.log(stringifySecret(secret))
    })
    .catch((error) => {
      console.log(`${error}`)
    })

  // Tests getting all secrets
  // await kv.getAllSecrets().then((secrets) => {
  //   console.log(stringifySecrets(secrets))
  // })
}

start()


/// TODO HTTP server