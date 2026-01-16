import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import InquiryEmail from '@/emails/InquiryEmail';

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, email, phoneNumber, company, position, preferredStartDate } = body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !preferredStartDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, email, phoneNumber, preferredStartDate' },
        { status: 400 }
      );
    }

    const emailHtml = await render(
      <InquiryEmail 
        fullName={fullName}
        email={email}
        phoneNumber={phoneNumber}
        company={company}
        position={position}
        preferredStartDate={preferredStartDate}
      />
    );

    const data = await resend.emails.send({
      from: 'Virtual Office Inquiry <onboarding@resend.dev>', // Update with your verified domain
      to: ['ndelatorre08252002@gmail.com'], // Update with your email
      replyTo: email,
      subject: `New Virtual Office Inquiry from ${fullName}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
