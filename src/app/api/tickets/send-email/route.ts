import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, email, tickets, qrCodes } = await request.json();

    if (!paymentId || !email || !tickets || !qrCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Create HTML email content
    let ticketsHtml = '';
    tickets.forEach((ticket: any, index: number) => {
      const qrCodeData = qrCodes[ticket.ticketId];
      ticketsHtml += `
        <div style="border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px;">
          <h3 style="color: #333;">Ingresso #${index + 1}</h3>
          <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Evento:</strong> ${ticket.eventTitle}</p>
          <p><strong>Data:</strong> ${ticket.eventDate}</p>
          <p><strong>Local:</strong> ${ticket.eventLocation}</p>
          <p><strong>Portador:</strong> ${ticket.customerName}</p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeData}" alt="QR Code" style="max-width: 200px;" />
            <p style="font-size: 12px; color: #666;">Apresente este QR Code na entrada do evento</p>
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Seus Ingressos Digitais</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">Seus Ingressos Digitais</h1>
            <p style="color: #666;">Pagamento ID: ${paymentId}</p>
          </div>
          
          ${ticketsHtml}
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px;">
            <h3 style="color: #92400e; margin-top: 0;">Instruções Importantes:</h3>
            <ul style="color: #92400e; font-size: 14px;">
              <li>Chegue com antecedência ao evento</li>
              <li>Apresente um documento de identidade junto com o ingresso</li>
              <li>Cada QR Code é válido apenas uma vez</li>
              <li>Mantenha seus ingressos salvos no celular ou impressos</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              Este e-mail foi enviado automaticamente. Em caso de dúvidas, entre em contato conosco.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@gorki.com',
      to: email,
      subject: `Seus Ingressos Digitais - Pagamento ${paymentId}`,
      html: htmlContent,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ingressos enviados por e-mail com sucesso!' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
