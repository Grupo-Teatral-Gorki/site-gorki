import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { tickets, qrCodes } = await request.json();

    if (!tickets || !qrCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try to load brand logos from public folder and embed as data URLs
    async function loadDataUrl(filename: string): Promise<string | null> {
      try {
        const filePath = path.join(process.cwd(), 'public', filename);
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filename).replace('.', '') || 'png';
        return `data:image/${ext};base64,${buf.toString('base64')}`;
      } catch {
        return null;
      }
    }

    const logoWhiteDataUrl = await loadDataUrl('logo-mark-white.png');

    // Create tickets in groups of 6 per page (portrait page, 2 columns x 3 rows)
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
          <div class="ticket">
            <div class="ticket-single">
              <div class="top-row">
                <div class="brand-and-title">
                  ${logoWhiteDataUrl ? `<img src="${logoWhiteDataUrl}" class="brand-logo" alt="Logo" />` : `<div class="brand-badge">GORKI</div>`}
                  <div class="headline">APRESENTA</div>
                  <h2 class="title">${ticket.eventTitle}</h2>
                </div>
              </div>
              <div class="lines">
                <div class="line portador"><span class="label">Comprador</span><span class="value">${ticket.customerName}</span></div>
                <div class="line duo">
                  <div class="half"><span class="label">Data e Horário</span><span class="value">${ticket.eventDate}</span></div>
                  <div class="half"><span class="label">Local</span><span class="value">${ticket.eventLocation}</span></div>
                </div>
              </div>     
              <div class="chips">
                <span class="chip">#${String(ticketNumber).padStart(3, '0')}</span>
                <span class="chip">Válido 1x</span>
                <span class="chip">${(ticket.ticketType === 'meia') ? 'Meia' : 'Inteira'}</span>
              </div>         
              <div class="qr-wrap bottom">
                <img src="${qrCodeData}" class="qr big" alt="QR" />
              </div>
              
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
              width: 210mm;   /* portrait width */
              height: 297mm;  /* portrait height */
              padding: 8mm;   /* a bit more breathing space for 6 tickets */
              display:flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              margin: 0;
              background: white;
              box-sizing: border-box;
            }
            
            .page-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;           /* two columns */
              grid-template-rows: repeat(3, 1fr);        /* three rows */
              column-gap: 6mm;                           /* horizontal gap */
              row-gap: 6mm;                              /* vertical gap */
              height: 100%;
              width: 100%;
              align-items: stretch;   /* fill vertical space */
              justify-items: stretch; /* fill column width */
            }

            /* New Branded Ticket Styles (Black/White/Yellow only) */
            .ticket {
              display: block; /* single column card */
              background: #0b0b0b;
              border-radius: 12px;
              overflow: hidden;
              border: 2px solid #1f2937;
              color: #f8fafc;
              position: relative;
              height: 100%;     /* fill the grid row height */
              min-height: auto;
              width: 100%;
            }

            .ticket-single { padding: 12px 12px 20px; background: #000; height: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; box-sizing: border-box; }
            .top-row { display: block; width: 100%; }
            .brand-and-title { display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; width: 100%; text-align: center; }

            .brand-badge {
              display: inline-block;
              font-weight: 900;
              letter-spacing: 1px;
              padding: 2px 6px;
              border-radius: 6px;
              background: #f59e0b;
              color: #111827;
              font-size: 8px;
            }

            .brand-logo {
              height: 40px; /* slightly larger for visibility */
              width: auto;
              display: block;
              filter: brightness(1);
            }

            .headline {
              margin-top: 6px;
              font-size: 10px;
              letter-spacing: 2px;
              font-weight: 800;
              color: #FEC800;
              text-align: center;
            }

            .title {
              margin-top: 3px;
              font-size: 18px;
              line-height: 1.2;
              font-weight: 800;
              color: #fff;
              text-align: center;
            }

            .lines { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; align-items: center; width: 100%; }
            .line { display: flex; align-items: center; gap: 8px; justify-content: center; text-align: center; }
            .line.portador .label { font-size: 8px; color: #d1d5db; text-transform: uppercase; letter-spacing: .5px; }
            .line.portador .value { font-size: 10px; font-weight: 700; color: #f8fafc; }
            .line.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 90%; justify-items: center; }
            .line.duo .label { display:block; font-size: 8px; color: #d1d5db; text-transform: uppercase; }
            .line.duo .value { display:block; font-size: 10px; font-weight: 700; color: #f8fafc; }

            .meta-item {
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 6px;
              padding: 4px 6px;
            }

            .meta-label {
              display: block;
              font-size: 6px;
              color: #d1d5db;
              text-transform: uppercase;
              letter-spacing: .5px;
            }

            .meta-value {
              display: block;
              font-size: 8px;
              font-weight: 700;
              color: #f8fafc;
            }

            .chips {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              justify-content: center;
              margin-bottom: 6px; /* keep away from rounded bottom edge */
            }

            .chip {
              font-size: 7px;
              padding: 2px 6px;
              border-radius: 9999px;
              background: #111827;
              border: 1px solid #f59e0b;
              color: #f59e0b;
              font-weight: 700;
            }

            .qr-wrap { display: flex; align-items: center; justify-content: center; }
            .qr { width: 88px; height: 88px; background: #fff; padding: 4px; border-radius: 6px; border: 1px solid #374151; }
            .qr.big { width: 120px; height: 120px; margin-bottom: 6px; }
            
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
