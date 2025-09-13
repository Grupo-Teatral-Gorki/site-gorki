import { NextRequest, NextResponse } from 'next/server';
import { ticketStore } from '@/lib/ticketStore';

// Hardcoded validation password
const VALIDATION_PASSWORD = 'Gorki123';

export async function POST(request: NextRequest) {
  try {
    const { ticketId, password } = await request.json();

    if (!ticketId || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID do ingresso e senha são obrigatórios',
          status: 'error'
        },
        { status: 400 }
      );
    }

    // Check password first
    if (password !== VALIDATION_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: 'Senha de validação incorreta',
        status: 'unauthorized'
      }, { status: 401 });
    }

    // Find the ticket in the store
    const ticket = await ticketStore.get(ticketId);
    
    if (!ticket) {
      return NextResponse.json({
        success: false,
        message: 'Ingresso não encontrado ou inválido',
        status: 'invalid'
      }, { status: 404 });
    }

    // Check if ticket is already used
    if (ticket.isUsed) {
      return NextResponse.json({
        success: false,
        message: 'Ingresso já foi utilizado',
        status: 'used',
        ticketInfo: {
          ticketNumber: ticket.ticketNumber,
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventLocation: ticket.eventLocation,
          customerName: ticket.customerName,
          ticketIndex: ticket.ticketIndex,
          totalTickets: ticket.totalTickets,
          isUsed: ticket.isUsed,
          usedAt: ticket.usedAt
        }
      });
    }

    // Mark ticket as used
    const updatedTicket = {
      ...ticket,
      isUsed: true,
      usedAt: new Date().toISOString()
    };
    await ticketStore.set(ticketId, updatedTicket);

    console.log(`✅ Ticket ${ticket.ticketNumber} validated successfully by staff`);

    return NextResponse.json({
      success: true,
      message: 'Ingresso válido! Entrada autorizada',
      status: 'validated',
      ticketInfo: {
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        customerName: ticket.customerName,
        ticketIndex: ticket.ticketIndex,
        totalTickets: ticket.totalTickets,
        isUsed: true,
        usedAt: updatedTicket.usedAt
      }
    });

  } catch (error) {
    console.error('Error validating ticket with password:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
