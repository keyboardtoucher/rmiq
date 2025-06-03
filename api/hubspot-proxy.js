// /api/hubspot-proxy.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        // Only allow POST
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let email = undefined;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
        // Handle JSON payload
        email = req.body.email || req.body.Email;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Handle classic form payload
        const raw = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => { data += chunk });
            req.on('end', () => resolve(data));
        });
        const params = new URLSearchParams(raw);
        email = params.get('email') || params.get('Email');
    }

    // Debug: log body and parsed email
    console.log('BODY:', req.body, 'EMAIL:', email);

    // Validate email
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Prepare payload for HubSpot
    const hubspotData = {
        fields: [
            { name: 'email', value: email }
        ]
    };

    // Your HubSpot portal ID and form ID
    const portalId = '49350138';
    const formId = '6668b052-3b43-4308-a222-5d5087ac3bf7'; // formname on site: rmiqcollect

    // Send request to HubSpot
    const hubspotResp = await fetch(
        `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hubspotData)
        }
    );

    // Respond OK to frontend
    return res.status(200).json({ status: 'ok', hubspotStatus: hubspotResp.status });
}