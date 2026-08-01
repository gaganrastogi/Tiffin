import { getStore } from '@netlify/blobs';

const EMPTY_STATE = { subscriptions: [], entries: [] };

export default async (req) => {
  const store = getStore('tiffin-tracker');

  try {
    if (req.method === 'GET') {
      const data = await store.get('data', { type: 'json' });
      return json(data || EMPTY_STATE);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      // very light shape check so a bad payload can't wipe things out silently
      if (!body || !Array.isArray(body.subscriptions) || !Array.isArray(body.entries)) {
        return json({ error: 'Invalid payload' }, 400);
      }
      await store.setJSON('data', body);
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err.message || 'Server error' }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = { path: '/api/data' };
