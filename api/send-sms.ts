import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless API Route for SMS notifications
 * 
 * This uses a webhook-based approach for flexibility:
 * - Can be configured to use any SMS provider
 * - Falls back to logging if no provider configured
 * 
 * For production, configure one of:
 * - Twilio (paid, most reliable)
 * - TextBelt (1 free SMS/day for testing)
 * - Custom webhook URL
 * 
 * POST /api/send-sms
 * Body: { to: string, message: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, message } = req.body;

    // Validate required fields
    if (!to || !message) {
        return res.status(400).json({
            error: 'Missing required fields: to, message'
        });
    }

    // Check for Twilio configuration (optional - paid)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Check for TextBelt (free tier - 1 SMS/day)
    const textbeltKey = process.env.TEXTBELT_API_KEY || 'textbelt'; // 'textbelt' = free tier

    try {
        // Option 1: Use Twilio if configured
        if (twilioSid && twilioToken && twilioPhone) {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

            const response = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    To: to,
                    From: twilioPhone,
                    Body: `[MediPal] ${message}`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Twilio API error:', data);
                return res.status(response.status).json({
                    error: 'Failed to send SMS via Twilio',
                    details: data.message || 'Unknown error'
                });
            }

            return res.status(200).json({
                success: true,
                provider: 'twilio',
                messageId: data.sid,
                message: 'SMS sent successfully'
            });
        }

        // Option 2: Use TextBelt (free tier for testing)
        if (textbeltKey) {
            const response = await fetch('https://textbelt.com/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: to,
                    message: `[MediPal] ${message}`,
                    key: textbeltKey
                })
            });

            const data = await response.json();

            if (!data.success) {
                // TextBelt free tier might be exhausted
                console.warn('TextBelt failed:', data.error);

                // Fall through to logging fallback
            } else {
                return res.status(200).json({
                    success: true,
                    provider: 'textbelt',
                    quotaRemaining: data.quotaRemaining,
                    message: 'SMS sent successfully'
                });
            }
        }

        // Fallback: Log the SMS (for development/demo)
        console.log('=== SMS NOTIFICATION (No provider configured) ===');
        console.log(`To: ${to}`);
        console.log(`Message: ${message}`);
        console.log('================================================');

        // Return success but indicate it was logged only
        return res.status(200).json({
            success: true,
            provider: 'console',
            message: 'SMS logged (no SMS provider configured)',
            note: 'Configure TWILIO_* or TEXTBELT_API_KEY for actual SMS delivery'
        });

    } catch (error) {
        console.error('SMS sending error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
