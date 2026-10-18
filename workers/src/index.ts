/*
 * =========================================
 * API SUBLYON — CLOUDFLARE WORKER
 * =========================================
 *
 * GET    /api/health          état de l'API
 * POST   /api/media           upload d'une photo (connecté)
 * GET    /api/media/{key}     lecture publique d'une photo
 * DELETE /api/media/{key}     suppression (propriétaire uniquement)
 */

const MAX_UPLOAD_BYTES =
  5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};


export default {
  async fetch(request: Request, env: Env): Promise<Response> {

    const url = new URL(request.url);

    const cors = corsHeaders(request, env);


    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }


    try {

      if (url.pathname === '/api/health') {
        return json({ status: 'ok', service: 'sublyon-api' }, 200, cors);
      }


      if (url.pathname === '/api/media' && request.method === 'POST') {
        return await uploadMedia(request, env, url, cors);
      }


      if (url.pathname.startsWith('/api/media/')) {

        const key =
          decodeURIComponent(url.pathname.slice('/api/media/'.length));

        if (request.method === 'GET') {
          return await getMedia(key, env, cors);
        }

        if (request.method === 'DELETE') {
          return await deleteMedia(request, key, env, cors);
        }

      }


      return json({ error: 'Route not found' }, 404, cors);

    } catch (err) {

      console.error('Erreur API :', err);

      return json({ error: 'Erreur serveur' }, 500, cors);

    }

  }
} satisfies ExportedHandler<Env>;


/*
 * =========================================
 * MÉDIAS (R2)
 * =========================================
 */

async function uploadMedia(
  request: Request,
  env: Env,
  url: URL,
  cors: HeadersInit
): Promise<Response> {

  const uid =
    await authenticate(request, env);

  if (!uid) {
    return json({ error: 'Non authentifié' }, 401, cors);
  }


  const contentType =
    (request.headers.get('Content-Type') ?? '').split(';')[0].trim();

  const extension =
    ALLOWED_TYPES[contentType];

  if (!extension) {
    return json({ error: 'Formats acceptés : JPG ou PNG' }, 415, cors);
  }


  const body =
    await request.arrayBuffer();

  if (body.byteLength === 0 || body.byteLength > MAX_UPLOAD_BYTES) {
    return json({ error: 'Photo vide ou trop lourde (5 Mo max)' }, 413, cors);
  }


  /*
   * Le préfixe contient l'UID :
   * il sert ensuite à vérifier
   * le propriétaire à la suppression.
   */
  const key =
    `listings/${uid}/${crypto.randomUUID()}.${extension}`;

  await env.sublyon_media.put(key, body, {
    httpMetadata: { contentType }
  });


  return json(
    { key, url: `${url.origin}/api/media/${key}` },
    201,
    cors
  );

}


async function getMedia(
  key: string,
  env: Env,
  cors: HeadersInit
): Promise<Response> {

  const object =
    await env.sublyon_media.get(key);

  if (!object) {
    return json({ error: 'Photo introuvable' }, 404, cors);
  }


  const headers =
    new Headers(cors);

  object.writeHttpMetadata(headers);

  headers.set('Cache-Control', 'public, max-age=31536000, immutable');


  return new Response(object.body, { headers });

}


async function deleteMedia(
  request: Request,
  key: string,
  env: Env,
  cors: HeadersInit
): Promise<Response> {

  const uid =
    await authenticate(request, env);

  if (!uid) {
    return json({ error: 'Non authentifié' }, 401, cors);
  }


  if (!key.startsWith(`listings/${uid}/`)) {
    return json({ error: 'Accès refusé' }, 403, cors);
  }


  await env.sublyon_media.delete(key);

  return new Response(null, { status: 204, headers: cors });

}


/*
 * =========================================
 * AUTHENTIFICATION FIREBASE
 * =========================================
 *
 * Vérifie le jeton d'identité Firebase
 * (Authorization: Bearer <idToken>) avec
 * les clés publiques de Google.
 * Retourne l'UID, ou null si invalide.
 */

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedKeys: { keys: JsonWebKey[]; expiresAt: number } | null = null;


async function authenticate(
  request: Request,
  env: Env
): Promise<string | null> {

  const header =
    request.headers.get('Authorization') ?? '';

  const token =
    header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return null;
  }


  try {

    const [encodedHeader, encodedPayload, encodedSignature] =
      token.split('.');

    const jwtHeader =
      JSON.parse(decodeBase64Url(encodedHeader));

    const payload =
      JSON.parse(decodeBase64Url(encodedPayload));


    const now =
      Math.floor(Date.now() / 1000);

    const projectId =
      env.FIREBASE_PROJECT_ID;


    if (
      jwtHeader.alg !== 'RS256' ||
      payload.aud !== projectId ||
      payload.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      payload.exp <= now ||
      payload.iat > now + 60
    ) {
      return null;
    }


    const jwk =
      (await getGoogleKeys()).find(
        k => (k as { kid?: string }).kid === jwtHeader.kid
      );

    if (!jwk) {
      return null;
    }


    const publicKey =
      await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );


    const valid =
      await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        base64UrlToBytes(encodedSignature),
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
      );


    return valid ? payload.sub : null;

  } catch {

    return null;

  }

}


async function getGoogleKeys(): Promise<JsonWebKey[]> {

  if (cachedKeys && cachedKeys.expiresAt > Date.now()) {
    return cachedKeys.keys;
  }


  const response =
    await fetch(JWKS_URL);

  const data =
    await response.json() as { keys: JsonWebKey[] };


  const maxAge =
    Number(/max-age=(\d+)/.exec(response.headers.get('Cache-Control') ?? '')?.[1] ?? 3600);

  cachedKeys = {
    keys: data.keys,
    expiresAt: Date.now() + maxAge * 1000
  };


  return data.keys;

}


/*
 * =========================================
 * OUTILS
 * =========================================
 */

function corsHeaders(
  request: Request,
  env: Env
): HeadersInit {

  const origin =
    request.headers.get('Origin') ?? '';

  const allowed =
    env.ALLOWED_ORIGINS.split(',').map(o => o.trim());


  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Vary': 'Origin'
  };

}


function json(
  data: unknown,
  status: number,
  headers: HeadersInit
): Response {

  return Response.json(data, { status, headers });

}


function base64UrlToBytes(
  value: string
): Uint8Array<ArrayBuffer> {

  const base64 =
    value.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));

}


function decodeBase64Url(
  value: string
): string {

  return new TextDecoder().decode(base64UrlToBytes(value));

}
