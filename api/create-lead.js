module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.BRIVITY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing BRIVITY_API_KEY. Add it in Vercel project settings.' });
    return;
  }

  const body = req.body || {};
  const { first_name, last_name, phone, email, notes, source } = body;

  if (!((first_name && last_name) || email || phone)) {
    res.status(400).json({ error: 'Missing required lead fields (name, email, or phone).' });
    return;
  }

  const brivityPayload = {
    lead_type: 'buyer',
    status: 'new',
    source: source || 'TikTok/Facebook Bio Quiz',
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    description: notes || undefined
  };

  try {
    const brivityRes = await fetch('https://secure.brivity.com/api/v2/leads', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token token=${apiKey}`
      },
      body: JSON.stringify(brivityPayload)
    });

    const text = await brivityRes.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!brivityRes.ok) {
      res.status(brivityRes.status).json({ error: 'Brivity rejected the request', details: data });
      return;
    }

    res.status(200).json({ success: true, lead: data });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Brivity', details: String(err) });
  }
};
