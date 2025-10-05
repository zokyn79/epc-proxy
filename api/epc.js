// api/epc.js
import fetch from 'node-fetch';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const postcode = req.query.postcode;
  if (!postcode) return res.status(400).json({ error: 'postcode required' });

  const email = process.env.EPC_EMAIL;
  const apiKey = process.env.EPC_KEY;

  if (!email || !apiKey)
    return res.status(500).json({ error: 'missing credentials' });

  const url = `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}&size=100`;

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
      }
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `upstream ${resp.status}` });
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'service unavailable' });
  }
};
