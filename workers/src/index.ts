import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAccessToken, firestorePatch } from './lib/firestore'

type Bindings = {
  DB: D1Database
  // FILES: R2Bucket  // uncomment after enabling R2
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGINS: string
  FIREBASE_SERVICE_ACCOUNT: string
  SESSION_SECRET: string
}

type Variables = {
  user: { uid: string; email: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', async (c, next) => {
  const origins = c.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) ?? []
  return cors({ origin: origins, allowHeaders: ['Authorization', 'Content-Type'] })(c, next)
})

app.get('/api/health', async (c) => {
  const sa = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT) as {
    client_email: string
    private_key: string
  }
  const token = await getAccessToken(sa)
  await firestorePatch(c.env.FIREBASE_PROJECT_ID, token, '_health/ping', {
    ok: true,
    at: new Date().toISOString(),
  })
  return c.json({ ok: true, firestore: true, projectId: c.env.FIREBASE_PROJECT_ID })
})

// Auth middleware — applied to all /api/* except /api/health
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/health') return next()

  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401)
  }
  // TODO: verify Firebase ID token (Step 5)
  return next()
})

export default app
