import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import ScheduleEmail from '@/emails/ScheduleEmail';

export async function POST(req) {
  try {
    const body = await req.json();
    const { contact, email } = body;

    // Validate required fields
    if (!contact || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contact, email' },
        { status: 400 }
      );
    }

    // Render email template
    let emailHtml;
    try {
      emailHtml = await render(
        <ScheduleEmail contact={contact} email={email} />
      );
    } catch (renderError) {
      console.error('Email render error:', renderError);
      throw new Error(`Failed to render email: ${renderError.message}`);
    }

    // Send email via Resend
    let data;
    try {
      // Validate resend is properly initialized
      if (!resend) {
        throw new Error('Resend instance is not initialized');
      }
      if (!resend.emails) {
        throw new Error('Resend emails API is not available. Check RESEND_API_KEY environment variable.');
      }

      data = await resend.emails.send({
        from: 'Meeting Schedule <onboarding@resend.dev>', // Update with your verified domain
        to: ['ndelatorre08252002@gmail.com'], // Update with your email
        replyTo: email,
        subject: 'Meeting Schedule Request',
        html: emailHtml,
      });
    } catch (sendError) {
      console.error('Resend send error:', sendError);
      throw new Error(`Failed to send email: ${sendError.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
