import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

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

// Validate webhook signature according to MercadoPago docs
function validateSignature(xSignature: string, xRequestId: string, dataID: string, body: string): boolean {
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not configured - skipping signature validation');
    return true; // Allow for development, but log warning
  }

  try {
    // Extract timestamp and signature from x-signature header
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    // Create the signed string according to MercadoPago format
    const signedString = `id:${dataID};request-id:${xRequestId};ts:${ts};`;
    
    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET);
    hmac.update(signedString);
    const expectedSignature = hmac.digest('hex');
    
    return expectedSignature === hash;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get headers for signature validation
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    // Get query parameters
    const url = new URL(request.url);
    const dataID = url.searchParams.get('data.id');
    const type = url.searchParams.get('type');
    const topic = url.searchParams.get('topic');
    
    // Get body
    const body = await request.text();
    let parsedBody: any = {};
    // MercadoPago often sends empty body for notifications; do not fail if body is empty or not JSON
    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch (_e) {
      // Keep parsedBody as empty object; continue processing using query params
      parsedBody = {};
    }

    console.log('Webhook received:', {
      type,
      dataID,
      topic,
      action: parsedBody.action,
      live_mode: parsedBody.live_mode,
      hasBody: !!body
    });

    // Validate signature for security
    if (xSignature && xRequestId && dataID) {
      const isValid = validateSignature(xSignature, xRequestId, dataID, body);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401, headers: corsHeaders });
      }
    }

    // Process payment notifications
    // Accept when either: type=payment with data.id, or topic=payment with data.id, or body contains the id
    const candidatePaymentId = parsedBody?.data?.id || dataID;
    const isPaymentType = type === 'payment' || topic === 'payment';
    const action = parsedBody?.action;

    if (isPaymentType && candidatePaymentId) {
      const paymentId = candidatePaymentId;
      
      try {
        // Fetch payment details from MercadoPago API
        const response = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch payment details:', response.status);
          return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500, headers: corsHeaders });
        }

        const paymentInfo = await response.json();
        
        console.log('Payment details:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          status_detail: paymentInfo.status_detail,
          external_reference: paymentInfo.external_reference,
          transaction_amount: paymentInfo.transaction_amount,
          payment_method_id: paymentInfo.payment_method_id,
          date_created: paymentInfo.date_created,
          date_approved: paymentInfo.date_approved,
        });

        // Here you would typically:
        // 1. Update your database with the payment status
        // 2. Send confirmation emails
        // 3. Generate tickets for approved payments
        // 4. Handle refunds for cancelled payments
        
        // Generate tickets for approved payments
        if (paymentInfo.status === 'approved') {
          console.log('✅ Payment approved:', paymentInfo.external_reference);
          
          // Generate tickets directly (not via HTTP call to avoid CORS issues)
          try {
            const { ticketStore } = await import('@/lib/ticketStore');
            const { randomUUID } = await import('crypto');

            // Save payment data first
            const meta = paymentInfo.metadata || {};
            const metaInteira = parseInt(meta.ticket_inteira_qty || '0');
            const metaMeia = parseInt(meta.ticket_meia_qty || '0');
            const computedTotal = (metaInteira + metaMeia) || parseInt(meta.ticket_quantity || '1');
            const paymentData = {
              paymentId: paymentInfo.id.toString(),
              status: 'approved',
              externalReference: paymentInfo.external_reference,
              // Prefer form values we sent in metadata to avoid masked payer names/emails
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

            await ticketStore.savePayment(paymentData);

            // If this payment is for the Desventuras event, also record a simplified entry
            try {
              const eventId = paymentData.eventId || '';
              if (eventId.startsWith('desventuras')) {
                await addDoc(collection(db, 'desventuras'), {
                  name: paymentData.customerName,
                  email: paymentData.customerEmail,
                  quantity: paymentData.ticketQuantity,
                  paymentId: paymentData.paymentId,
                  status: paymentData.status,
                  eventId: paymentData.eventId,
                  eventTitle: paymentData.eventTitle,
                  createdAt: paymentData.createdAt,
                });
                console.log('📝 Saved desventuras entry for', paymentData.customerName);
              }
            } catch (e) {
              console.error('Error saving desventuras entry:', e);
            }

            // Generate tickets
            const ticketQuantity = computedTotal;
            const tickets = [];
            
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
                ticketType: (metaInteira + metaMeia) > 0 ? (i <= metaInteira ? 'inteira' : 'meia') : (paymentData.ticketType),
                generatedAt: new Date().toISOString(),
                isValid: true,
                isUsed: false
              };

              // Store ticket in Firestore
              await ticketStore.set(ticketId, qrData);
              tickets.push(qrData);
            }

            console.log(`✅ Generated ${tickets.length} tickets for payment ${paymentInfo.id}`);
          } catch (error) {
            console.error('Error generating tickets:', error);
          }
        } else if (paymentInfo.status === 'rejected') {
          console.log('❌ Payment rejected:', paymentInfo.external_reference);
        } else if (paymentInfo.status === 'pending') {
          console.log('⏳ Payment pending:', paymentInfo.external_reference);
        }

      } catch (error) {
        console.error('Error processing payment webhook:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500, headers: corsHeaders });
      }
    }

    // Return 200 OK as required by MercadoPago
    return NextResponse.json({ received: true }, { status: 200, headers: corsHeaders });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500, headers: corsHeaders });
  }
}

