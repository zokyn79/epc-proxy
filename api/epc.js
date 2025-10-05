// api/epc.js
import fetch from 'node-fetch';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { postcode, lmk, format } = req.query;
  const email = process.env.EPC_EMAIL;
  const apiKey = process.env.EPC_KEY;

  if (!email || !apiKey)
    return res.status(500).json({ error: 'missing credentials' });

  // If an LMK key is supplied, fetch the full certificate in requested format
  if (lmk) {
    const certUrl = `https://epc.opendatacommunities.org/api/v1/display/certificate/${encodeURIComponent(lmk)}`;
    try {
      let accept, isPdf;
      if (format === 'pdf') {
        accept = 'application/pdf';
        isPdf = true;
      } else {
        accept = 'text/html';
        isPdf = false;
      }
      const certResp = await fetch(certUrl, {
        headers: {
          Accept: accept,
          Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
        }
      });
      if (!certResp.ok)
        return res.status(certResp.status).send(isPdf ? 'PDF not available' : 'Not available');
      res.setHeader('Content-Type', certResp.headers.get('content-type') || (isPdf ? 'application/pdf' : 'text/html'));
      if (isPdf) {
        // binary forward for pdf
        const arrayBuffer = await certResp.arrayBuffer();
        return res.status(200).send(Buffer.from(arrayBuffer));
      }
      const html = await certResp.text();
      return res.status(200).send(html);
    } catch (e) {
      return res.status(500).send(format === 'pdf' ? 'Could not fetch EPC PDF' : 'Could not fetch EPC certificate');
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
      if (!resp.ok)
        return res.status(resp.status).json({ error: `upstream ${resp.status}` });
      const data = await resp.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'service unavailable' });
    }
  }

  return res.status(400).json({ error: 'postcode or lmk required' });
};
