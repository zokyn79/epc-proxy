// api/epc.js
import fetch from 'node-fetch';

export default async (req, res) => {
  // allow your live domain + local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const postcode = req.query.postcode;
  if (!postcode) return res.status(400).json({ error: 'postcode required' });

  const url = `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}&size=100`;
  const apiKey = process.env.EPC_KEY;          // we’ll add this in Vercel dashboard

  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json', Authorization: `Basic ${btoa(apiKey + ':')}` } });
    if (!resp.ok) throw new Error('upstream error');
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown' });
  }
};