import { NextRequest, NextResponse } from 'next/server';
import { ticketStore } from '@/lib/ticketStore';

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'Dados do QR Code ausentes' },
        { status: 400 }
      );
    }

    let ticketInfo;
    try {
      ticketInfo = JSON.parse(qrData);
    } catch (e) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'QR Code inválido - formato incorreto',
          status: 'invalid'
        },
        { status: 400 }
      );
    }

    // Find the ticket in the store
    const storedTicket = await ticketStore.get(ticketInfo.ticketId);
    
    if (!storedTicket) {
      return NextResponse.json({
        success: false,
        status: 'invalid',
        message: 'Ingresso não encontrado ou inválido',
        details: 'Este QR Code não corresponde a nenhum ingresso válido.'
      });
    }

    // Check if ticket is already used
    if (storedTicket.isUsed) {
      return NextResponse.json({
        success: false,
        status: 'used',
        message: 'Ingresso já utilizado',
        details: `Este ingresso foi utilizado em ${new Date(storedTicket.usedAt!).toLocaleString('pt-BR')}.`,
        ticketInfo: {
          ticketNumber: storedTicket.ticketNumber,
          eventTitle: storedTicket.eventTitle,
          eventDate: storedTicket.eventDate,
          customerName: storedTicket.customerName,
          usedAt: storedTicket.usedAt
        }
      });
    }

    // Mark ticket as used
    const updatedTicket = {
      ...storedTicket,
      isUsed: true,
      usedAt: new Date().toISOString()
    };
    await ticketStore.set(storedTicket.ticketId, updatedTicket);

    console.log(`Ticket ${updatedTicket.ticketNumber} validated and marked as used`);

    return NextResponse.json({
      valid: true,
      message: 'Ingresso válido! Entrada autorizada',
      status: 'validated',
      ticketInfo: {
        ticketNumber: storedTicket.ticketNumber,
        eventTitle: storedTicket.eventTitle,
        eventDate: storedTicket.eventDate,
        eventLocation: storedTicket.eventLocation,
        customerName: storedTicket.customerName,
        ticketIndex: storedTicket.ticketIndex,
        totalTickets: storedTicket.totalTickets,
        validatedAt: storedTicket.usedAt
      }
    });

  } catch (error) {
    console.error('Error validating ticket:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Erro interno do servidor',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
