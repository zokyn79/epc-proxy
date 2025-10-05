// api/epc.js
import fetch from 'node-fetch';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { postcode, lmk } = req.query;
  const email = process.env.EPC_EMAIL;
  const apiKey = process.env.EPC_KEY;

  if (!email || !apiKey)
    return res.status(500).json({ error: 'missing credentials' });

  // If an LMK key is supplied, fetch the full display certificate (HTML page)
  if (lmk) {
    const certUrl = `https://epc.opendatacommunities.org/api/v1/display/certificate/${encodeURIComponent(lmk)}`;
    try {
      const certResp = await fetch(certUrl, {
        headers: {
          Accept: 'text/html', // To display as a normal page/browser tab
          Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
        }
      });
      if (!certResp.ok) return res.status(certResp.status).send('Not available');
      const html = await certResp.text();
      res.setHeader('Content-Type', certResp.headers.get('content-type') || 'text/html');
      return res.status(200).send(html);
    } catch (e) {
      return res.status(500).send('Could not fetch EPC certificate');
    }
  }

  // If a postcode is supplied, use the summary search (this returns JSON you already use)
  if (postcode) {
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
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'service unavailable' });
    }
  }

  // Must supply one or the other.
  return res.status(400).json({ error: 'postcode or lmk required' });
};
