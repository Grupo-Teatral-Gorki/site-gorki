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

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting test ticket generation...');
    
    const paymentId = "125499217237";
    const store = ticketStore as FirestoreTicketStore;

    // Save test payment data
    const paymentData = {
      paymentId: paymentId,
      status: 'approved',
      externalReference: `test-${Date.now()}`,
      customerName: "João Silva",
      customerEmail: "joao@example.com",
      eventId: "evento-teste-1",
      eventTitle: "Espetáculo de Teatro",
      eventDate: "2024-02-15 20:00",
      eventLocation: "Teatro Municipal de Itapevi",
      ticketQuantity: 2,
      ticketType: "inteira",
      totalAmount: 50.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving payment data...');
    await store.savePayment(paymentData);

    // Generate 2 test tickets
    const tickets = [];
    for (let i = 1; i <= 2; i++) {
      const ticketId = crypto.randomUUID();
      const ticketNumber = `TEATRO-${paymentId}-${i.toString().padStart(3, '0')}`;
      
      const ticketData = {
        ticketId,
        ticketNumber,
        eventId: paymentData.eventId,
        eventTitle: paymentData.eventTitle,
        eventDate: paymentData.eventDate,
        eventLocation: paymentData.eventLocation,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        paymentId: paymentId,
        externalReference: paymentData.externalReference,
        ticketType: paymentData.ticketType,
        ticketIndex: i,
        totalTickets: 2,
        generatedAt: new Date().toISOString(),
        isValid: true,
        isUsed: false
      };

      console.log(`🎫 Creating ticket ${i}: ${ticketId}`);
      await ticketStore.set(ticketId, ticketData);
      
      tickets.push({
        ticketId,
        ticketNumber,
        customerName: ticketData.customerName,
        eventTitle: ticketData.eventTitle,
        eventDate: ticketData.eventDate,
        eventLocation: ticketData.eventLocation
      });
    }

    console.log(`✅ Successfully created ${tickets.length} test tickets`);

    return NextResponse.json({
      success: true,
      message: `Created ${tickets.length} test tickets for payment ${paymentId}`,
      paymentId: paymentId,
      tickets: tickets,
      totalTickets: tickets.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error creating test tickets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test tickets', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
