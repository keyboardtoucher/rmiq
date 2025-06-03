// /api/hubspot-proxy.js

export default async function handler(req, res) {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            console.error('[ERROR] Method Not Allowed:', req.method);
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        let email = undefined;
        const contentType = req.headers['content-type'] || '';
        let rawBody = '';

        // Parse request body depending on content type
        if (contentType.includes('application/json')) {
            // If JSON, use req.body directly
            email = req.body.email || req.body.Email;
            rawBody = JSON.stringify(req.body);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // If form data, manually read the body and parse as URL-encoded
            rawBody = await new Promise((resolve, reject) => {
                let data = '';
                req.on('data', chunk => { data += chunk });
                req.on('end', () => resolve(data));
            });
            const params = new URLSearchParams(rawBody);
            email = params.get('email') || params.get('Email');
        }

        // Log the incoming request body and parsed email
        console.log(`[INFO] Received request: BODY: ${rawBody} | EMAIL: ${email}`);

        // Validate that email was provided
        if (!email) {
            console.error('[ERROR] No email provided. Body:', rawBody);
            return res.status(400).json({ error: 'Email is required' });
        }

        // Prepare HubSpot payload in the format required by their API
        const hubspotData = {
            fields: [
                { name: 'email', value: email }
            ]
        };

        // Log the HubSpot payload before sending
        console.log(`[INFO] Sending to HubSpot:`, JSON.stringify(hubspotData));

        // Set your HubSpot portal ID and form ID
        const portalId = '49350138';
        const formId = '6668b052-3b43-4308-a222-5d5087ac3bf7'; // Use your actual form ID here

        // Try to send the data to HubSpot API
        let hubspotResp;
        let hubspotRespText = '';
        try {
            hubspotResp = await fetch(
                `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(hubspotData)
                }
            );
            // Read the response body from HubSpot
            hubspotRespText = await hubspotResp.text();
        } catch (hubspotError) {
            // Log and return errors related to the fetch request to HubSpot
            console.error('[ERROR] Fetch to HubSpot failed:', hubspotError);
            return res.status(502).json({ error: 'Failed to contact HubSpot', details: hubspotError.message });
        }

        // Log the response from HubSpot (status code and body)
        console.log(`[INFO] HubSpot response: Status ${hubspotResp.status}, Body: ${hubspotRespText}`);

        // Final success log for tracking processed emails
        console.log(`[SUCCESS] Email ${email} processed successfully (Status: ${hubspotResp.status})`);

        // Respond to the frontend (Elementor, Framer, etc.)
        return res.status(200).json({ status: 'ok', hubspotStatus: hubspotResp.status });

    } catch (error) {
        // Log any unexpected server-side errors
        console.error('[FATAL ERROR]', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}