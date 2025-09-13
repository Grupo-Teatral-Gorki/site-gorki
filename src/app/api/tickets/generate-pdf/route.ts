import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tickets, qrCodes } = await request.json();

    if (!tickets || !qrCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a comprehensive HTML document that can be printed as PDF
    let ticketsHtml = '';
    tickets.forEach((ticket: any, index: number) => {
      const qrCodeData = qrCodes[ticket.ticketId];
      ticketsHtml += `
        <div class="ticket-page" style="page-break-after: ${index < tickets.length - 1 ? 'always' : 'avoid'};">
          <div class="ticket-container">
            <div class="ticket-header">
              <h1>INGRESSO DIGITAL</h1>
              <h2>${ticket.eventTitle}</h2>
            </div>
            
            <div class="ticket-content">
              <div class="ticket-info">
                <div class="info-row">
                  <span class="label">Ingresso:</span>
                  <span class="value">#${index + 1} - ${ticket.ticketNumber}</span>
                </div>
                <div class="info-row">
                  <span class="label">Data:</span>
                  <span class="value">${ticket.eventDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Local:</span>
                  <span class="value">${ticket.eventLocation}</span>
                </div>
                <div class="info-row">
                  <span class="label">Portador:</span>
                  <span class="value">${ticket.customerName}</span>
                </div>
              </div>
              
              <div class="qr-section">
                <img src="${qrCodeData}" alt="QR Code" class="qr-code" />
                <p class="qr-instructions">
                  Apresente este QR Code na entrada do evento<br/>
                  <strong>Válido apenas uma vez</strong>
                </p>
              </div>
            </div>
            
            <div class="ticket-footer">
              <div class="instructions">
                <h3>Instruções Importantes:</h3>
                <ul>
                  <li>Chegue com antecedência ao evento</li>
                  <li>Apresente documento de identidade junto com o ingresso</li>
                  <li>Mantenha o ingresso salvo no celular ou impresso</li>
                  <li>Em caso de problemas, entre em contato conosco</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ingressos Digitais</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              color: #333;
              background: white;
            }
            
            .ticket-page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              background: white;
            }
            
            .ticket-container {
              border: 3px solid #2563eb;
              border-radius: 15px;
              overflow: hidden;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            
            .ticket-header {
              background: linear-gradient(135deg, #2563eb, #7c3aed);
              color: white;
              padding: 30px;
              text-align: center;
            }
            
            .ticket-header h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
              letter-spacing: 2px;
            }
            
            .ticket-header h2 {
              font-size: 24px;
              font-weight: normal;
              opacity: 0.9;
            }
            
            .ticket-content {
              padding: 40px;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .ticket-info {
              margin-bottom: 40px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 18px;
            }
            
            .info-row:last-child {
              border-bottom: none;
            }
            
            .label {
              font-weight: bold;
              color: #374151;
            }
            
            .value {
              color: #1f2937;
            }
            
            .qr-section {
              text-align: center;
              margin: 40px 0;
            }
            
            .qr-code {
              width: 200px;
              height: 200px;
              border: 2px solid #d1d5db;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            
            .qr-instructions {
              font-size: 16px;
              color: #6b7280;
              line-height: 1.5;
            }
            
            .ticket-footer {
              background: #fef3c7;
              padding: 30px;
              border-top: 2px solid #f59e0b;
            }
            
            .instructions h3 {
              color: #92400e;
              font-size: 20px;
              margin-bottom: 15px;
            }
            
            .instructions ul {
              list-style: none;
              color: #92400e;
            }
            
            .instructions li {
              padding: 5px 0;
              position: relative;
              padding-left: 20px;
            }
            
            .instructions li:before {
              content: "•";
              position: absolute;
              left: 0;
              font-weight: bold;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .ticket-page {
                margin: 0;
                width: 100%;
                min-height: 100vh;
              }
            }
            
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${ticketsHtml}
        </body>
      </html>
    `;

    // Return HTML that can be printed as PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="ingressos.html"',
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
