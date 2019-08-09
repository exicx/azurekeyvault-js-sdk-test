const { SecretsClient } = require('@azure/keyvault-secrets')
// https://azure.github.io/azure-sdk-for-js/identity/index.html#credentials
// To authenticate, we need these 3 environment variables
// AZURE_CLIENT_ID - service principal's app id
// AZURE_TENANT_ID - id of the principal's Azure Active Directory tenant
// AZURE_CLIENT_SECRET - one of the service principal's client secrets
const { DefaultAzureCredential } = require('@azure/identity')

// Decode base64 value provided via environment and overwrite the variable
process.env.AZURE_CLIENT_SECRET = Buffer.from(process.env.AZURE_CLIENT_SECRET, 'base64').toString('utf16le')

const localURL = process.env.LK_VURI
const globalURL = process.env.LK_GVURI

async function auth () {
  // Function static variable to cache the authentication credentials
  if (auth.credentials === undefined) {
    auth.credentials = new DefaultAzureCredential()
  }
  return auth.credentials
}

// async function auth () {
//   return new DefaultAzureCredential()
// }

async function getLocalClient () {
  const credentials = await auth().catch((error) => { console.error(error) })

  // Function static variable to cache the local client context
  if (getLocalClient.context === undefined) {
    getLocalClient.context = new SecretsClient(localURL, credentials)
  }
  return getLocalClient.context
}

async function getGlobalClient () {
  const credentials = await auth().catch((error) => { console.error(error) })

  if (getGlobalClient.context === undefined) {
    getGlobalClient.context = new SecretsClient(globalURL, credentials)
  }
  return getGlobalClient.context
}

// Get all secret objects from both global and local vaults
exports.getAllSecrets = async function () {
  const globalClient = await getGlobalClient().catch((error) => { console.error(error) })
  const localClient = await getLocalClient().catch((error) => { console.error(error) })

  // Store the promises in this array
  // Resolve them all and return the results
  const localSecrets = []
  const globalSecrets = []

  // listSecrets is an async iterable. Requires a for..await..of loop to iterate over it,
  // This is available in ES7 or node >= 10

  // Send out the api request to get the secret value of each secret in the global Vault
  for await (const secretAttr of globalClient.listSecrets()) {
    const secret = globalClient.getSecret(secretAttr.name).catch((error) => { console.error(error) })
    globalSecrets.push(secret)
  }

  // Send out the api request to get the secret value of each secret in the local Vault
  for await (const secretAttr of localClient.listSecrets()) {
    const secret = localClient.getSecret(secretAttr.name).catch((error) => { console.error(error) })
    localSecrets.push(secret)
  }

  // Concatenated array of both global and local secret promises
  const secrets = [...globalSecrets, ...localSecrets]

  // Resolve all the secret promises and return them as an array of secret objects
  return Promise.all(secrets)
}

// Get a single secret object, checking both global and local vaults
exports.getSecret = async function (keyname) {
  const globalClient = await getGlobalClient().catch((error) => { console.error(error) })
  const localClient = await getLocalClient().catch((error) => { console.error(error) })

  // Check the global Vault first
  const secret = await globalClient.getSecret(keyname)
    .catch((_error) => {
      console.error(`info: getSecret: Secret ${keyname} doesn't exist in global vault`)
    })

  // return the secret if it exists in the global vault
  if (secret) {
    return secret
  }

  // Otherwise return the promise from the local vault search
  return localClient.getSecret(keyname)
}
