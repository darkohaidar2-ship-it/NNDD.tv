import { setZeroCacheHeaders, pingLionOtt } from './_lib.js';

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username, password, server_url } = req.query;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    const status = await pingLionOtt(username, password, server_url);
    return res.status(200).json(status);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
