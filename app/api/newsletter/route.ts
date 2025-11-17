import { NextRequest, NextResponse } from 'next/server';
import { subscribeEmail, isEmailSubscribed } from '@/lib/db/newsletter';

// POST - Subscribe an email to the newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required and must be a string' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already subscribed
    const alreadySubscribed = await isEmailSubscribed(normalizedEmail);
    if (alreadySubscribed) {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    // Subscribe the email
    const subscription = await subscribeEmail(normalizedEmail);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
        data: subscription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error subscribing email:', error);

    // Handle SQLite unique constraint error (in case of race condition)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
