import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { generateTicketsPdf } from '@/lib/pdf/generateTicketsPdf';
import fs from 'fs/promises';
import path from 'path';

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
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_NGROK_URL || 'http://localhost:3000';
  }
  return 'https://www.grupogorki.com.br';
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

            // Extract metadata
            const meta = paymentInfo.metadata || {};
            const metaInteira = parseInt(meta.ticket_inteira_qty || '0');
            const metaMeia = parseInt(meta.ticket_meia_qty || '0');
            const computedTotal = (metaInteira + metaMeia) || parseInt(meta.ticket_quantity || '1');
            const transactionId = meta.transaction_id || paymentInfo.external_reference;

            // Update transaction status to 'aprovado'
            try {
              await fetch(`${getBaseUrl()}/api/transactions/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId,
                  status: 'aprovado',
                  paymentId: paymentInfo.id.toString(),
                  externalReference: paymentInfo.external_reference,
                  additionalData: {
                    paymentType: paymentInfo.payment_method_id,
                    transactionAmount: paymentInfo.transaction_amount,
                    dateApproved: paymentInfo.date_approved,
                  }
                })
              });
              console.log('✅ Transaction updated to aprovado:', transactionId);
            } catch (e) {
              console.error('Failed to update transaction status:', e);
            }

            // Save payment data for backward compatibility
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
              // NEW: per-type counts for admin reporting
              ticketInteiraQty: metaInteira,
              ticketMeiaQty: metaMeia,
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

            // Build QR images map for PDF
            const qrCodes: Record<string, string> = {};
            for (const t of tickets) {
              try {
                const payload = JSON.stringify({
                  ticketId: t.ticketId,
                  ticketNumber: t.ticketNumber,
                  eventId: t.eventId,
                  paymentId: t.paymentId,
                  ticketIndex: t.ticketIndex,
                });
                qrCodes[t.ticketId] = await QRCode.toDataURL(payload);
              } catch (e) {
                console.error('QR generation failed for ticket', t.ticketId, e);
              }
            }

            // Generate PDF buffer
            let pdfBuffer: Uint8Array | null = null;
            try {
              pdfBuffer = await generateTicketsPdf(tickets as any[], qrCodes);
            } catch (e) {
              console.error('PDF generation failed:', e);
            }

            // Email the tickets PDF if we have buffer and email
            const recipient = paymentData.customerEmail;
            if (pdfBuffer && recipient) {
              try {
                // Load logo for email
                async function loadLogoDataUrl(filename: string): Promise<string | null> {
                  try {
                    const filePath = path.join(process.cwd(), 'public', filename);
                    const buf = await fs.readFile(filePath);
                    const ext = path.extname(filename).replace('.', '') || 'png';
                    return `data:image/${ext};base64,${buf.toString('base64')}`;
                  } catch {
                    return null;
                  }
                }
                const logoDataUrl = "https://firebasestorage.googleapis.com/v0/b/itapevi-cce4e.firebasestorage.app/o/logo-mark-white.png?alt=media&token=44ee639e-3ff9-43a4-8417-5d4d31408909"

                const transporter = nodemailer.createTransport({
                  host: process.env.SMTP_HOST || 'smtp.gmail.com',
                  port: parseInt(process.env.SMTP_PORT || '587'),
                  secure: false,
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                  },
                });

                await transporter.sendMail({
                  from: `"Grupo Teatral Gorki" <${process.env.SMTP_USER}>`,
                  replyTo: process.env.SMTP_FROM || 'noreply@grupoteatralgorki.com',
                  to: recipient,
                  subject: `🎭 Seus ingressos - ${paymentData.eventTitle}`,
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body {
                          margin: 0;
                          padding: 0;
                          font-family: 'Arial', 'Helvetica', sans-serif;
                          background-color: #f4f4f4;
                        }
                        .container {
                          max-width: 600px;
                          margin: 0 auto;
                          background-color: #ffffff;
                        }
                        .header {
                          background: #000000;
                          padding: 40px 20px;
                          text-align: center;
                        }
                        .logo {
                          font-size: 32px;
                          font-weight: 900;
                          color: #facc15;
                          letter-spacing: 2px;
                          margin: 0;
                        }
                        .subtitle {
                          color: #e5e7eb;
                          font-size: 14px;
                          margin-top: 10px;
                          letter-spacing: 3px;
                          font-weight: 600;
                          text-transform: uppercase;
                        }
                        .content {
                          padding: 40px 30px;
                        }
                        .greeting {
                          font-size: 24px;
                          color: #1a1a1a;
                          margin-bottom: 20px;
                          font-weight: 700;
                        }
                        .message {
                          font-size: 16px;
                          color: #4a4a4a;
                          line-height: 1.6;
                          margin-bottom: 30px;
                        }
                        .event-card {
                          background: #000000;
                          border-radius: 12px;
                          padding: 25px;
                          margin: 30px 0;
                          border-left: 4px solid #facc15;
                        }
                        .event-title {
                          font-size: 22px;
                          font-weight: 800;
                          color: #facc15;
                          margin: 0 0 15px 0;
                        }
                        .event-details {
                          color: #e5e7eb;
                          font-size: 15px;
                          line-height: 1.8;
                        }
                        .event-details strong {
                          color: #facc15;
                          font-weight: 700;
                        }
                        .info-box {
                          background-color: #fef9c3;
                          border-left: 4px solid #facc15;
                          padding: 20px;
                          margin: 25px 0;
                          border-radius: 4px;
                        }
                        .info-box p {
                          margin: 0;
                          color: #5d4e00;
                          font-size: 14px;
                          line-height: 1.6;
                        }
                        .attachment-notice {
                          background-color: #f0f0f0;
                          padding: 20px;
                          border-radius: 8px;
                          text-align: center;
                          margin: 25px 0;
                        }
                        .attachment-icon {
                          font-size: 40px;
                          margin-bottom: 10px;
                        }
                        .attachment-text {
                          color: #4a4a4a;
                          font-size: 14px;
                          margin: 5px 0;
                        }
                        .footer {
                          background-color: #000000;
                          padding: 30px 20px;
                          text-align: center;
                          color: #9ca3af;
                          font-size: 12px;
                        }
                        .footer a {
                          color: #facc15;
                          text-decoration: none;
                        }
                        .footer a:hover {
                          color: #fde047;
                        }
                        .divider {
                          height: 1px;
                          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
                          margin: 30px 0;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <!-- Header -->
                        <div class="header">
                          ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Grupo Teatral Gorki" style="height: 80px; width: auto; margin: 0 auto 15px;" />` : '<h1 class="logo">GORKI</h1>'}                          
                        </div>
                        
                        <!-- Content -->
                        <div class="content">
                          <h2 class="greeting">Olá, ${paymentData.customerName || 'Cliente'}! 👋</h2>
                          
                          <p class="message">
                            Obrigado pela sua compra! Estamos muito felizes em recebê-lo(a) em nosso espetáculo.
                            Seus ingressos estão anexados neste e-mail em formato PDF.
                          </p>
                          
                          <!-- Event Card -->
                          <div class="event-card">
                            <h3 class="event-title">🎭 ${paymentData.eventTitle}</h3>
                            <div class="event-details">
                              <p><strong>📅 Data e Horário:</strong> ${paymentData.eventDate}</p>
                              <p><strong>📍 Local:</strong> ${paymentData.eventLocation}</p>
                              <p><strong>🎫 Quantidade:</strong> ${paymentData.ticketQuantity} ${paymentData.ticketQuantity === 1 ? 'ingresso' : 'ingressos'}</p>
                            </div>
                          </div>
                          
                          <!-- Important Info -->
                          <div class="info-box">
                            <p><strong>⚠️ Informações Importantes:</strong></p>
                            <p style="margin-top: 10px;">
                              • Apresente o PDF na entrada do evento<br>
                              • Cada QR Code é válido para <strong>uma única entrada</strong><br>
                              • Chegue com antecedência para facilitar a entrada<br>
                              • Guarde este e-mail para consulta
                            </p>
                          </div>
                          
                          <!-- Attachment Notice -->
                          <div class="attachment-notice">
                            <div class="attachment-icon">📎</div>
                            <p class="attachment-text"><strong>Seus ingressos estão anexados neste e-mail</strong></p>
                            <p class="attachment-text">Arquivo: ingressos.pdf</p>
                          </div>
                          
                          <div class="divider"></div>
                          
                          <p class="message" style="text-align: center; color: #666;">
                            Nos vemos no teatro! 🎭✨
                          </p>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer">
                          <p>Grupo Teatral Gorki</p>
                          <p style="margin-top: 15px; font-size: 11px;">
                            Este é um e-mail automático. Por favor, não responda.
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `,
                  attachments: [
                    {
                      filename: 'ingressos.pdf',
                      content: Buffer.from(pdfBuffer),
                      contentType: 'application/pdf',
                    },
                  ],
                });
                console.log('📧 Tickets emailed to', recipient);
              } catch (e) {
                console.error('Failed to send email for payment', paymentInfo.id, e);
              }
            } else {
              console.warn('Skipping email: missing pdfBuffer or recipient');
            }
          } catch (error) {
            console.error('Error generating tickets:', error);
          }
        } else if (paymentInfo.status === 'rejected') {
          console.log('❌ Payment rejected:', paymentInfo.external_reference);

          // Update transaction status to 'recusado'
          const meta = paymentInfo.metadata || {};
          const transactionId = meta.transaction_id || paymentInfo.external_reference;
          try {
            await fetch(`${getBaseUrl()}/api/transactions/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId,
                status: 'recusado',
                paymentId: paymentInfo.id.toString(),
                externalReference: paymentInfo.external_reference,
                additionalData: {
                  paymentType: paymentInfo.payment_method_id,
                  statusDetail: paymentInfo.status_detail,
                }
              })
            });
            console.log('✅ Transaction updated to recusado:', transactionId);
          } catch (e) {
            console.error('Failed to update transaction status:', e);
          }
        } else if (paymentInfo.status === 'pending') {
          console.log('⏳ Payment pending:', paymentInfo.external_reference);

          // Update transaction status to 'pendente'
          const meta = paymentInfo.metadata || {};
          const transactionId = meta.transaction_id || paymentInfo.external_reference;
          try {
            await fetch(`${getBaseUrl()}/api/transactions/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId,
                status: 'pendente',
                paymentId: paymentInfo.id.toString(),
                externalReference: paymentInfo.external_reference,
                additionalData: {
                  paymentType: paymentInfo.payment_method_id,
                  statusDetail: paymentInfo.status_detail,
                }
              })
            });
            console.log('✅ Transaction updated to pendente:', transactionId);
          } catch (e) {
            console.error('Failed to update transaction status:', e);
          }
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

