import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ticketStore } from '@/lib/ticketStore';
import { FirestoreTicketStore, type PaymentData } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, externalReference, customerInfo, eventInfo, ticketQuantity } = await request.json();

    if (!paymentId || !externalReference || !customerInfo || !eventInfo || !ticketQuantity) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes' },
        { status: 400 }
      );
    }

    // First, save payment data to payments collection
    const store = ticketStore as FirestoreTicketStore;
    const paymentData: PaymentData = {
      paymentId,
      status: 'approved',
      externalReference,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      eventId: eventInfo.id,
      eventTitle: eventInfo.title,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      ticketQuantity,
      totalAmount: 0, // This should come from the payment data
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await store.savePayment(paymentData);

    // Generate unique tickets
    const tickets = [];
    for (let i = 1; i <= ticketQuantity; i++) {
      const ticketId = crypto.randomUUID();
      const ticketNumber = `${eventInfo.id}-${paymentId}-${i.toString().padStart(3, '0')}`;
      
      // Create QR code data with validation info
      const qrData = {
        ticketId,
        ticketNumber,
        eventId: eventInfo.id,
        eventTitle: eventInfo.title,
        eventDate: eventInfo.date,
        eventLocation: eventInfo.location,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        paymentId,
        externalReference,
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

    console.log(`Generated ${tickets.length} tickets for payment ${paymentId}`);

    return NextResponse.json({
      success: true,
      tickets,
      totalTickets: tickets.length
    });

  } catch (error) {
    console.error('Error generating tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar ingressos' },
      { status: 500 }
    );
  }
}

