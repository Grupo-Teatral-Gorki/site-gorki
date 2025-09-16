import { NextRequest, NextResponse } from 'next/server';

// Use the REST API approach instead of SDK to avoid import issues
const MERCADOPAGO_BASE_URL = 'https://api.mercadopago.com';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// Helper function to get base URL based on environment
function getBaseUrl(): string {
  // If NEXT_PUBLIC_BASE_URL is set, use it (for production)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Check environment
  if (process.env.NODE_ENV === 'development') {
    // For local development, use localhost
    return process.env.NEXT_PUBLIC_NGROK_URL || 'http://localhost:3000';
  }
  
  // Fallback for production
  return 'https://www.grupogorki.com.br';
}

export async function POST(request: NextRequest) {
  try {
    const { amount, customerInfo, eventInfo, ticketQuantity, ticketType = 'inteira' } = await request.json();

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'MercadoPago access token not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create preference for MercadoPago using REST API
    const preferenceData = {
      items: [
        {
          id: eventInfo.id || 'event-ticket',
          title: `${eventInfo.title} - ${ticketQuantity} ingresso(s) ${ticketType === 'inteira' ? 'Inteira' : 'Meia'}`,
          description: `Evento: ${eventInfo.title} | Data: ${eventInfo.date} | Local: ${eventInfo.location} | Tipo: ${ticketType === 'inteira' ? 'Inteira' : 'Meia'}`,
          quantity: ticketQuantity,
          unit_price: Number((amount / ticketQuantity).toFixed(2)),
          currency_id: 'BRL',
        }
      ],
      payer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: {
          number: customerInfo.phone || '',
        },
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
      binary_mode: false,
      back_urls: {
        success: `${getBaseUrl()}/payment-success`,
        failure: `${getBaseUrl()}/payment-failure`,
        pending: `${getBaseUrl()}/payment-pending`,
      },
      external_reference: `event-${eventInfo.id}-${Date.now()}`,
      metadata: {
        event_title: eventInfo.title,
        event_date: eventInfo.date,
        event_location: eventInfo.location,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || '',
        ticket_quantity: ticketQuantity.toString(),
        ticket_type: ticketType,
      },
      notification_url: `${getBaseUrl()}/api/mercadopago/webhook`,
    };

    console.log('Creating preference with data:', JSON.stringify(preferenceData, null, 2));

    const response = await fetch(`${MERCADOPAGO_BASE_URL}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('MercadoPago API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to create payment preference', details: errorData },
        { status: response.status, headers: corsHeaders }
      );
    }

    const result = await response.json();
    console.log('MercadoPago preference created:', result);

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    return NextResponse.json(
      { error: 'Failed to create payment preference', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
