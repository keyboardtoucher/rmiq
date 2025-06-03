// /api/hubspot-proxy.js

module.exports = async (req, res) => {
    console.log('--- NEW REQUEST ---');
    console.log('METHOD:', req.method);
    console.log('HEADERS:', req.headers);

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        console.log('RAW BODY:', body);

        let email;
        try {
            // Try parse JSON
            const parsed = JSON.parse(body);
            email = parsed.email || parsed.Email;
            console.log('PARSED EMAIL:', email);
        } catch (e) {
            console.log('JSON PARSE ERROR:', e.message);
        }

        if (!email) {
            console.log('NO EMAIL!');
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Email is required' }));
        }

        // Prepare payload for HubSpot
        const hubspotData = {
            fields: [
                { name: 'email', value: email }
            ]
        };

        // Your HubSpot portal ID and form ID
        const portalId = '49350138';
        const formId = '6668b052-3b43-4308-a222-5d5087ac3bf7';

        // Send request to HubSpot
        try {
            const hubspotResp = await fetch(
                `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(hubspotData)
                }
            );
            console.log('HUBSPOT STATUS:', hubspotResp.status);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', hubspotStatus: hubspotResp.status }));
        } catch (err) {
            console.log('HUBSPOT ERROR:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'HubSpot Error', details: err.message }));
        }
    });
};