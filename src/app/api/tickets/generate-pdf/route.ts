import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { tickets, qrCodes } = await request.json();

    if (!tickets || !qrCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create tickets in groups of 6 per page (3x2 grid)
    let ticketsHtml = '';
    for (let i = 0; i < tickets.length; i += 6) {
      const pageTickets = tickets.slice(i, i + 6);
      const isLastPage = i + 6 >= tickets.length;
      
      ticketsHtml += `
        <div class="tickets-page"${!isLastPage ? ' style="page-break-after: always;"' : ''}>
          <div class="page-grid">
      `;
      
      pageTickets.forEach((ticket: any, pageIndex: number) => {
        const qrCodeData = qrCodes[ticket.ticketId];
        const ticketNumber = i + pageIndex + 1;
        
        ticketsHtml += `
          <div class="ticket-container">
            <div class="ticket-header">
              <div class="header-content">
                <div class="ticket-type">🎭 INGRESSO DIGITAL</div>
                <h2 class="event-title">${ticket.eventTitle}</h2>
                <div class="ticket-number">#${String(ticketNumber).padStart(3, '0')}</div>
              </div>
            </div>
            
            <div class="ticket-body">
              <div class="ticket-info">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                      <span class="info-label">Data & Hora</span>
                      <span class="info-value">${ticket.eventDate}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon">📍</div>
                    <div class="info-content">
                      <span class="info-label">Local</span>
                      <span class="info-value">${ticket.eventLocation}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon">👤</div>
                    <div class="info-content">
                      <span class="info-label">Portador</span>
                      <span class="info-value">${ticket.customerName}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon">🎫</div>
                    <div class="info-content">
                      <span class="info-label">Código</span>
                      <span class="info-value">${ticket.ticketNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="qr-section">
                <div class="qr-instructions">
                  <div class="instruction-text">Apresente este código na entrada</div>
                  <div class="warning-text">⚠️ Válido apenas uma vez</div>
                </div>
                <div class="qr-container">
                  <img src="${qrCodeData}" alt="QR Code" class="qr-code" />
                </div>
              </div>
            </div>
            
            <div class="ticket-footer">
              <div class="footer-pattern"></div>
            </div>
          </div>
        `;
      });
      
      ticketsHtml += `
          </div>
        </div>
      `;
    }

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
            
            .tickets-page {
              width: 210mm;
              height: 297mm;
              padding: 5mm;
              margin: 0;
              background: white;
              box-sizing: border-box;
            }
            
            .page-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 3mm;
              height: 100%;
              width: 100%;
            }
            
            .ticket-container {
              background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              position: relative;
            }
            
            .ticket-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #2563eb, #7c3aed, #dc2626, #ea580c);
            }
            
            .ticket-header {
              background: linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #be185d 100%);
              color: white;
              padding: 6px 8px;
              position: relative;
              overflow: hidden;
            }
            
            .ticket-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="80" r="2" fill="white" opacity="0.1"/><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></svg>');
            }
            
            .header-content {
              position: relative;
              z-index: 1;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .ticket-type {
              font-size: 8px;
              font-weight: bold;
              letter-spacing: 0.5px;
              opacity: 0.9;
            }
            
            .event-title {
              font-size: 10px;
              font-weight: bold;
              margin: 0;
              text-align: center;
              flex: 1;
              padding: 0 4px;
            }
            
            .ticket-number {
              font-size: 8px;
              font-weight: bold;
              background: rgba(255, 255, 255, 0.2);
              padding: 2px 4px;
              border-radius: 4px;
              letter-spacing: 0.5px;
            }
            
            .ticket-body {
              padding: 4px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2px;
              margin-bottom: 4px;
            }
            
            .info-item {
              display: flex;
              align-items: center;
              gap: 3px;
              padding: 2px;
              background: #f8fafc;
              border-radius: 4px;
              border-left: 2px solid #e2e8f0;
            }
            
            .info-icon {
              font-size: 8px;
              width: 12px;
              text-align: center;
            }
            
            .info-content {
              flex: 1;
              min-width: 0;
            }
            
            .info-label {
              display: block;
              font-size: 6px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              line-height: 1;
            }
            
            .info-value {
              display: block;
              font-size: 7px;
              color: #1e293b;
              font-weight: 500;
              line-height: 1.2;
              margin-top: 1px;
            }
            
            .qr-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
              background: #f1f5f9;
              border-radius: 4px;
              padding: 3px;
              border: 1px dashed #cbd5e1;
            }
            
            .qr-container {
              flex-shrink: 0;
            }
            
            .qr-code {
              width: 45px;
              height: 45px;
              border: 1px solid #e2e8f0;
              border-radius: 3px;
              background: white;
            }
            
            .qr-instructions {
              text-align: center;
            }
            
            .instruction-text {
              font-size: 6px;
              color: #475569;
              font-weight: 500;
              line-height: 1.2;
            }
            
            .warning-text {
              font-size: 5px;
              color: #dc2626;
              font-weight: 600;
              margin-top: 1px;
              line-height: 1;
            }
            
            .ticket-footer {
              height: 4px;
              position: relative;
              overflow: hidden;
            }
            
            .footer-pattern {
              height: 100%;
              background: repeating-linear-gradient(
                90deg,
                #e2e8f0 0px,
                #e2e8f0 8px,
                #cbd5e1 8px,
                #cbd5e1 16px
              );
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              .tickets-page {
                margin: 0;
                width: 100%;
                height: 100vh;
                box-sizing: border-box;
              }
              
              .page-grid {
                height: 100%;
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

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });
    
    await browser.close();
    
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
