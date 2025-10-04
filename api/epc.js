// api/epc.js
import fetch from 'node-fetch';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const postcode = req.query.postcode;
  if (!postcode) return res.status(400).json({ error: 'postcode required' });

  const url = `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}&size=100`;
  const apiKey = process.env.EPC_KEY;

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });
    if (!resp.ok) {          // ← print real upstream status
      return res.status(resp.status).json({ error: `upstream ${resp.status}` });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'service unavailable' });
  }
};
