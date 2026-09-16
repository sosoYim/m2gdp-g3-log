// Firebase ID token verification using Google's JWK endpoint
// Docs: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

export type FirebaseClaims = {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  picture?: string
}

type JWK = JsonWebKey & { kid: string }

let cachedKeys: { keys: JWK[]; expiresAt: number } | null = null

async function getPublicKeys(): Promise<JWK[]> {
  const now = Date.now()
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys

  const res = await fetch(JWK_URL)
  if (!res.ok) throw new Error('Failed to fetch Firebase public keys')

  const cc = res.headers.get('Cache-Control') ?? ''
  const match = cc.match(/max-age=(\d+)/)
  const maxAge = match ? parseInt(match[1]) * 1000 : 3_600_000

  const data = (await res.json()) as { keys: JWK[] }
  cachedKeys = { keys: data.keys, expiresAt: now + maxAge }
  return data.keys
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

function parseB64url(s: string): unknown {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)))
}

export async function verifyIdToken(token: string, projectId: string): Promise<FirebaseClaims> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed JWT')

  const [headerB64, payloadB64, sigB64] = parts

  const header = parseB64url(headerB64) as { kid: string; alg: string }
  const payload = parseB64url(payloadB64) as {
    sub: string
    iss: string
    aud: string
    exp: number
    iat: number
    email: string
    email_verified: boolean
    name?: string
    picture?: string
  }

  // Claim checks
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) throw new Error('Token expired')
  if (payload.aud !== projectId) throw new Error('Invalid audience')
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid issuer')
  if (!payload.sub) throw new Error('Missing subject')

  // Signature verification
  const keys = await getPublicKeys()
  const jwk = keys.find((k) => k.kid === header.kid)
  if (!jwk) throw new Error('No matching public key for kid: ' + header.kid)

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    b64urlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  )
  if (!valid) throw new Error('Invalid token signature')

  return {
    uid: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  }
}
