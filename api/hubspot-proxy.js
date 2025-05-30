// /api/hubspot-proxy.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        // Only allow POST
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Parse data from Elementor webhook
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Prepare payload for HubSpot
        const hubspotData = {
            fields: [
                {
                    name: 'email',
                    value: email
                }
            ]
        };

        // Your HubSpot portal ID and form ID
        const portalId = '49350138';
        const formId = '34e375be-bdc6-4f26-bb3e-f9f73a113d8c';

        // Send request to HubSpot
        const hubspotResp = await fetch(
            `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hubspotData)
            }
        );

        // Respond OK to Elementor
        return res.status(200).json({ status: 'ok', hubspotStatus: hubspotResp.status });

    } catch (error) {
        // Return error for debugging
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
