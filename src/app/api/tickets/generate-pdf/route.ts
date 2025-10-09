import { NextRequest, NextResponse } from 'next/server';
import { generateTicketsPdf } from '@/lib/pdf/generateTicketsPdf';

export async function POST(request: NextRequest) {
  try {
    const { tickets, qrCodes } = await request.json();

    if (!tickets || !qrCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const pdfBuffer = await generateTicketsPdf(tickets, qrCodes);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ingressos.pdf"',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

