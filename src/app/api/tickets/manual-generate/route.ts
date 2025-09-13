import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ticketStore } from '@/lib/ticketStore';
import { FirestoreTicketStore } from '@/lib/firestore';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, externalReference, customerInfo, eventInfo, ticketQuantity } = await request.json();

    if (!paymentId || !customerInfo || !eventInfo || !ticketQuantity) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Manual ticket generation for payment:', paymentId);

    // Save payment data first
    const store = ticketStore as FirestoreTicketStore;
    const paymentData = {
      paymentId: paymentId.toString(),
      status: 'approved',
      externalReference: externalReference || `manual-${paymentId}`,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      eventId: eventInfo.id || 'manual-event',
      eventTitle: eventInfo.title,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      ticketQuantity: parseInt(ticketQuantity),
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await store.savePayment(paymentData);

    // Generate unique tickets
    const tickets = [];
    for (let i = 1; i <= ticketQuantity; i++) {
      const ticketId = crypto.randomUUID();
      const ticketNumber = `${eventInfo.id || 'EVENT'}-${paymentId}-${i.toString().padStart(3, '0')}`;
      
      // Create QR code data with validation info
      const qrData = {
        ticketId,
        ticketNumber,
        eventId: eventInfo.id || 'manual-event',
        eventTitle: eventInfo.title,
        eventDate: eventInfo.date,
        eventLocation: eventInfo.location,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        paymentId: paymentId.toString(),
        externalReference: externalReference || `manual-${paymentId}`,
        ticketIndex: i,
        totalTickets: ticketQuantity,
        generatedAt: new Date().toISOString(),
        isValid: true,
        isUsed: false
      };

      // Store ticket in persistent store
      await ticketStore.set(ticketId, qrData);

      tickets.push({
        ticketId,
        ticketNumber,
        qrData: JSON.stringify(qrData),
        customerName: customerInfo.name,
        eventTitle: eventInfo.title,
        eventDate: eventInfo.date,
        eventLocation: eventInfo.location
      });
    }

    console.log(`✅ Manually generated ${tickets.length} tickets for payment ${paymentId}`);

    return NextResponse.json({
      success: true,
      tickets,
      totalTickets: tickets.length,
      message: `Successfully generated ${tickets.length} tickets`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error manually generating tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar ingressos manualmente', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
