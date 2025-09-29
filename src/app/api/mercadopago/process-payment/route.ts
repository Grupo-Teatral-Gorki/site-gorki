import { NextRequest, NextResponse } from 'next/server';

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

// This endpoint allows the client to request a fresh status check for a given paymentId
// If the payment is approved, it will generate tickets (idempotent) and return them
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'MercadoPago access token not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch current payment status from Mercado Pago
    const response = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('MercadoPago fetch error:', response.status, errText);
      return NextResponse.json(
        { error: 'Failed to fetch payment', statusCode: response.status, details: errText },
        { status: 502, headers: corsHeaders }
      );
    }

    const paymentInfo = await response.json();

    // Always return the current status to the client
    const basePayload: any = {
      paymentId: paymentInfo.id?.toString() || paymentId,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
    };

    // If not approved, no further action
    if (paymentInfo.status !== 'approved') {
      return NextResponse.json(basePayload, { headers: corsHeaders });
    }

    // Approved: ensure tickets exist, otherwise create them
    try {
      const { ticketStore } = await import('@/lib/ticketStore');
      const { randomUUID } = await import('crypto');

      // If tickets already exist for this payment, return them directly
      const existing = await ticketStore.getByPaymentId(paymentId);
      if (existing.length > 0) {
        return NextResponse.json({ ...basePayload, tickets: existing, generated: false }, { headers: corsHeaders });
      }

      // Build payment data payload for storage
      const meta = paymentInfo.metadata || {};
      const metaInteira = parseInt(meta.ticket_inteira_qty || '0');
      const metaMeia = parseInt(meta.ticket_meia_qty || '0');
      const computedTotal = (metaInteira + metaMeia) || parseInt(meta.ticket_quantity || '1');
      const paymentData = {
        paymentId: paymentInfo.id.toString(),
        status: 'approved',
        externalReference: paymentInfo.external_reference,
        // Prefer form-submitted values from metadata to avoid masked payer data
        customerName: meta.customer_name || ((paymentInfo.payer?.first_name || '') + ' ' + (paymentInfo.payer?.last_name || '')),
        customerEmail: meta.customer_email || paymentInfo.payer?.email || '',
        eventId: meta.event_id || 'unknown',
        eventTitle: meta.event_title || 'Evento',
        eventDate: meta.event_date || 'Data não informada',
        eventLocation: meta.event_location || 'Local não informado',
        ticketQuantity: computedTotal,
        ticketType: meta.ticket_type || 'inteira',
        totalAmount: paymentInfo.transaction_amount || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await ticketStore.savePayment(paymentData as any);

      const ticketQuantity = computedTotal;
      const tickets: any[] = [];

      for (let i = 1; i <= ticketQuantity; i++) {
        const ticketId = randomUUID();
        const ticketNumber = `${paymentData.eventId}-${paymentInfo.id}-${i.toString().padStart(3, '0')}`;

        const qrData = {
          ticketId,
          ticketNumber,
          eventId: paymentData.eventId,
          eventTitle: paymentData.eventTitle,
          eventDate: paymentData.eventDate,
          eventLocation: paymentData.eventLocation,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          paymentId: paymentInfo.id.toString(),
          externalReference: paymentInfo.external_reference,
          ticketIndex: i,
          totalTickets: ticketQuantity,
          ticketType: (metaInteira + metaMeia) > 0 ? (i <= metaInteira ? 'inteira' : 'meia') : paymentData.ticketType,
          generatedAt: new Date().toISOString(),
          isValid: true,
          isUsed: false
        };

        await ticketStore.set(ticketId, qrData);
        tickets.push(qrData);
      }

      return NextResponse.json({ ...basePayload, tickets, generated: true }, { headers: corsHeaders });
    } catch (err) {
      console.error('Error generating tickets in process-payment:', err);
      return NextResponse.json(
        { ...basePayload, error: 'Failed to generate tickets' },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('process-payment error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
