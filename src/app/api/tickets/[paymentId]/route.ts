import { NextRequest, NextResponse } from 'next/server';
import { ticketStore, type TicketData } from '@/lib/ticketStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`Looking for tickets with payment ID: ${paymentId}`);
    console.log(`Total tickets in store: ${ticketStore.size}`);

    // Find tickets for this payment ID using the new store method
    const ticketsData = await ticketStore.getByPaymentId(paymentId);
    const tickets = ticketsData.map((ticketData: TicketData) => ({
      ticketId: ticketData.ticketId,
      ticketNumber: ticketData.ticketNumber,
      qrData: JSON.stringify(ticketData),
      customerName: ticketData.customerName,
      eventTitle: ticketData.eventTitle,
      eventDate: ticketData.eventDate,
      eventLocation: ticketData.eventLocation
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tickets,
      totalTickets: tickets.length
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ingressos' },
      { status: 500 }
    );
  }
}
