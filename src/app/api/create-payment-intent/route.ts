import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'brl', paymentMethod = 'card', customerInfo, eventInfo, ticketQuantity } = await request.json();

    // Create payment intent - start with card payments only
    let paymentIntentConfig: any = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        eventTitle: eventInfo.title,
        eventDate: eventInfo.date,
        eventLocation: eventInfo.location,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || '',
        ticketQuantity: ticketQuantity.toString(),
      },
      receipt_email: customerInfo.email,
    };

    // Configure payment methods based on request
    if (paymentMethod === 'pix') {
      // For PIX, we need to check if it's available in your Stripe account
      paymentIntentConfig.payment_method_types = ['pix'];
      paymentIntentConfig.payment_method_options = {
        pix: {
          expires_after_seconds: 300, // 5 minutes
        },
      };
    } else {
      // Default to card payments
      paymentIntentConfig.payment_method_types = ['card'];
      paymentIntentConfig.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never'
      };
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
