import { NextRequest, NextResponse } from 'next/server';
import { ticketStore, type TicketData } from '@/lib/ticketStore';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Looking for tickets with payment ID: ${paymentId}`);
    try { console.log(`Total tickets in store: ${await ticketStore.size()}`); } catch {}

    // Find tickets for this payment ID using the new store method
    const ticketsData = await ticketStore.getByPaymentId(paymentId);
    const tickets = ticketsData.map((ticketData: TicketData) => ({
      ticketId: ticketData.ticketId,
      ticketNumber: ticketData.ticketNumber,
      qrData: JSON.stringify(ticketData),
      customerName: ticketData.customerName,
      eventTitle: ticketData.eventTitle,
      eventDate: ticketData.eventDate,
      eventLocation: ticketData.eventLocation,
      ticketType: ticketData.ticketType || 'inteira'
    }));

    // Debug logging
    console.log(`Searching for tickets with payment ID: ${paymentId}`);
    console.log(`Total tickets in store: ${await ticketStore.size()}`);
    console.log(`Found ${tickets.length} tickets for payment ${paymentId}`);
    
    // Get all payment IDs for debugging
    const allPaymentIds: string[] = await ticketStore.getAllPaymentIds();
    console.log(`All payment IDs in store:`, allPaymentIds);

    if (tickets.length === 0) {
      return NextResponse.json(
        { 
          error: 'Nenhum ingresso encontrado para este pagamento',
          debug: {
            searchedPaymentId: paymentId,
            totalTicketsInStore: await ticketStore.size(),
            allPaymentIds: allPaymentIds
          }
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      tickets,
      totalTickets: tickets.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ingressos' },
      { status: 500, headers: corsHeaders }
    );
  }
}
