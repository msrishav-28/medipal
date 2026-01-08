import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless API Route for sending emails via Resend
 * Resend Free Tier: 3,000 emails/month, 100/day
 * 
 * POST /api/send-email
 * Body: { to: string, subject: string, message: string, patientName?: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, message, patientName } = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
        return res.status(400).json({
            error: 'Missing required fields: to, subject, message'
        });
    }

    // Get Resend API key from environment
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({
            error: 'Email service not configured',
            details: 'RESEND_API_KEY environment variable is missing'
        });
    }

    try {
        // Format email with HTML template
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2E7FD8 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .alert-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .alert-warning { background: #fef3c7; color: #92400e; }
            .alert-critical { background: #fee2e2; color: #991b1b; }
            .alert-info { background: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">💊 MediPal Alert</h1>
              ${patientName ? `<p style="margin: 5px 0 0 0; opacity: 0.9;">For patient: ${patientName}</p>` : ''}
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">${subject}</h2>
              <p>${message}</p>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                This is an automated notification from MediPal medication management system.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">MediPal - Medication Management Made Simple</p>
              <p style="margin: 5px 0 0 0;">You're receiving this because you're a registered caregiver.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // Send email via Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'MediPal <notifications@resend.dev>', // Use Resend's default domain for testing
                to: [to],
                subject: `[MediPal] ${subject}`,
                html: htmlContent,
                text: `${subject}\n\n${message}\n\n---\nMediPal - Medication Management`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return res.status(response.status).json({
                error: 'Failed to send email',
                details: data.message || 'Unknown error'
            });
        }

        return res.status(200).json({
            success: true,
            messageId: data.id,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
