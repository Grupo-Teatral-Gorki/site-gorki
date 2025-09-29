'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

interface Ticket {
  ticketId: string;
  ticketNumber: string;
  qrData: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketType?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  useEffect(() => {
    // Extract payment information from URL parameters
    const data = {
      paymentId: searchParams.get('payment_id'),
      status: searchParams.get('status'),
      externalReference: searchParams.get('external_reference'),
      merchantOrderId: searchParams.get('merchant_order_id'),
      preferenceId: searchParams.get('preference_id'),
      paymentType: searchParams.get('payment_type'),
    };
    setPaymentData(data);
    if (data.status) setPaymentStatus(data.status);
    
    // Automatically fetch tickets when payment data is available
    if (data.paymentId) {
      fetchTickets(data.paymentId);
    }
  }, [searchParams]);

  const fetchTickets = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/tickets/${paymentId}`);
      
      if (!response.ok) {
        if (response.status !== 404) {
          setError('Erro ao carregar ingressos');
        }
        // For 404 while status is pending/in_process, do not show error; keep UI in processing mode
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTickets(data.tickets);

      // Generate QR codes for each ticket
      const qrCodePromises = data.tickets.map(async (ticket: Ticket) => {
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : window.location.origin;
        const validationUrl = `${baseUrl}/validate/${ticket.ticketId}`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        return { ticketId: ticket.ticketId, qrCode: qrCodeDataUrl };
      });

      const qrCodeResults = await Promise.all(qrCodePromises);
      const qrCodeMap = qrCodeResults.reduce((acc: { [key: string]: string }, { ticketId, qrCode }: { ticketId: string, qrCode: string }) => {
        acc[ticketId] = qrCode;
        return acc;
      }, {} as { [key: string]: string });

      setQrCodes(qrCodeMap);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ingressos:', error);
      setError('Erro ao carregar ingressos');
      setLoading(false);
    }
  };

  // Poll Mercado Pago status and trigger server-side processing when pending
  useEffect(() => {
    let interval: any;
    const paymentId = paymentData?.paymentId;
    if (!paymentId) return;

    // Start polling when there are no tickets yet
    const startPolling = () => {
      let attempts = 0;
      const maxAttempts = 60; // ~5 minutes if 5s interval
      interval = setInterval(async () => {
        attempts++;
        try {
          // Ask server to fetch latest status and generate tickets if approved
          const res = await fetch(`/api/mercadopago/process-payment?paymentId=${paymentId}`, { cache: 'no-store' });
          const json = await res.json();
          if (json?.status) setPaymentStatus(json.status);

          // If approved and tickets may exist, try to fetch them
          if (json.status === 'approved') {
            await fetchTickets(paymentId);
            // Stop polling when tickets are fetched successfully
            clearInterval(interval);
          }
          // If rejected, stop polling and show error UI
          if (json.status === 'rejected') {
            clearInterval(interval);
            setError('Pagamento rejeitado. Tente novamente.');
          }
        } catch (e) {
          console.error('Polling error:', e);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 5000);
    };

    // Start polling if we don't yet have tickets
    if (tickets.length === 0) {
      startPolling();
    }

    return () => interval && clearInterval(interval);
  }, [paymentData?.paymentId, tickets.length]);


  const sendTicketsByEmail = async () => {
    if (!emailAddress || !tickets.length) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch('/api/tickets/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          email: emailAddress,
          tickets: tickets,
          qrCodes: qrCodes
        }),
      });

      if (response.ok) {
        alert('Ingressos enviados por e-mail com sucesso!');
        setEmailAddress('');
      } else {
        alert('Erro ao enviar ingressos por e-mail');
      }
    } catch (error) {
      console.error('Error sending tickets by email:', error);
      alert('Erro ao enviar ingressos por e-mail');
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadAllTicketsPDF = async () => {
    if (!tickets.length) return;
    
    setGeneratingPDF(true);
    try {
      const response = await fetch('/api/tickets/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: tickets,
          qrCodes: qrCodes
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ingressos-${paymentData.paymentId || 'tickets'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao gerar PDF dos ingressos');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF dos ingressos');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const downloadSingleTicket = (ticket: Ticket) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Branded ticket dimensions (landscape)
    canvas.width = 1000;
    canvas.height = 360; // slightly less height

    // Colors
    const bgDark = '#0b0b0b';
    const leftGradStart = '#1f1140';
    const leftGradMid = '#1a1035';
    const leftGradEnd = '#120a26';
    const yellow = '#f59e0b';
    const textLight = '#f8fafc';

    // Background
    ctx.fillStyle = bgDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Left panel gradient
    const leftWidth = Math.floor(canvas.width * 0.68);
    const grad = ctx.createLinearGradient(0, 0, leftWidth, canvas.height);
    grad.addColorStop(0, leftGradStart);
    grad.addColorStop(0.5, leftGradMid);
    grad.addColorStop(1, leftGradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, leftWidth, canvas.height);

    // Perforation strip
    const perfX = leftWidth + 8;
    ctx.fillStyle = '#ffffff22';
    for (let y = 10; y < canvas.height - 10; y += 16) {
      ctx.fillRect(perfX, y, 2, 8);
    }

    // Right stub background
    ctx.fillStyle = '#111827';
    ctx.fillRect(perfX + 10, 0, canvas.width - (perfX + 10), canvas.height);

    // Brand logo (white) at top-left
    const logo = new Image();
    logo.src = '/logo-mark-white.png';
    logo.onload = () => {
      ctx.drawImage(logo, 24, 22, 90, 28);
    };

    // Headline and title
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 22px Arial';
    ctx.fillText('INGRESSO', 24, 84);

    ctx.fillStyle = textLight;
    ctx.font = '800 32px Arial';
    wrapText(ctx, ticket.eventTitle, 24, 124, leftWidth - 48, 34);

    // Meta grid
    ctx.font = '600 14px Arial';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('Data', 24, 170);
    ctx.fillText('Local', 24 + 300, 170);
    ctx.fillText('Portador', 24, 230);

    ctx.fillStyle = textLight;
    ctx.font = '700 18px Arial';
    ctx.fillText(ticket.eventDate, 24, 192);
    ctx.fillText(ticket.eventLocation, 24 + 300, 192);
    wrapText(ctx, ticket.customerName, 24, 252, leftWidth - 48, 22);

    // Chips
    drawChip(ctx, `#${ticket.ticketNumber}`, 24, 300, yellow);
    drawChip(ctx, 'Válido 1x', 140, 300, yellow);
    drawChip(ctx, (ticket.ticketType === 'meia' ? 'Meia' : 'Inteira'), 240, 300, yellow);

    // QR on right stub (bigger and centered)
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 240;
      const qrX = perfX + 10 + ((canvas.width - (perfX + 10)) - qrSize) / 2;
      const qrY = 80;

      // QR container
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Stub captions (centered, no 'VALIDAÇÃO')
      ctx.fillStyle = yellow;
      ctx.font = '800 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(String(ticket.ticketNumber), qrX + qrSize / 2, qrY + qrSize + 46);

      // Brand mark under QR
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('GORKI', qrX + qrSize / 2, qrY + qrSize + 68);

      // Download
      const link = document.createElement('a');
      link.download = `ingresso-${ticket.ticketNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrCodes[ticket.ticketId];

    function drawChip(c: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
      c.font = '700 14px Arial';
      const w = c.measureText(text).width + 24;
      c.fillStyle = '#111827';
      c.fillRect(x, y - 18, w, 28);
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.strokeRect(x, y - 18, w, 28);
      c.fillStyle = color;
      c.fillText(text, x + 12, y);
    }

    function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
      const words = text.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = c.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          c.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      c.fillText(line.trim(), x, y);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus ingressos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Status-aware Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          {tickets.length > 0 ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h1>
              <p className="text-gray-600 mb-6">Seus ingressos digitais estão prontos! Você pode baixá-los ou enviá-los por e-mail.</p>
            </>
          ) : paymentStatus === 'rejected' ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento não aprovado</h1>
              <p className="text-gray-600 mb-6">Seu pagamento não foi aprovado. Tente novamente ou use outro método.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento em processamento</h1>
              <p className="text-gray-600 mb-6">Estamos confirmando seu pagamento com o Mercado Pago. Isso pode levar alguns minutos, especialmente para PIX/Boleto.</p>
            </>
          )}

          {/* Show status chip only when tickets are not yet displayed */}
          {paymentStatus && tickets.length === 0 && (
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatus === 'approved' ? 'bg-green-100 text-green-800' : paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                Status: {paymentStatus}
              </span>
            </div>
          )}

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                {paymentData.paymentId && (
                  <p><span className="font-medium">ID:</span> {paymentData.paymentId}</p>
                )}
              </div>
            </div>
          )}

          {/* Processing state when tickets are not yet available */}
          {tickets.length === 0 && (!error) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Processando seus ingressos…</h3>
                  <p className="text-sm text-yellow-800">Recebemos seu pagamento e estamos confirmando com o Mercado Pago. Para PIX/Boleto, a confirmação pode levar alguns minutos. Seus ingressos aparecerão automaticamente aqui quando estiverem prontos.</p>
                  {paymentData?.paymentId && (
                    <div className="mt-3">
                      <button
                        onClick={() => fetchTickets(paymentData.paymentId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 text-sm"
                      >
                        Atualizar agora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {tickets.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-purple-900 mb-2">Informações do Evento</h2>
              <div className="text-sm text-purple-800">
                <p><strong>Evento:</strong> {tickets[0].eventTitle}</p>
                <p><strong>Data:</strong> {tickets[0].eventDate}</p>
                <p><strong>Local:</strong> {tickets[0].eventLocation}</p>
                <p><strong>Portador:</strong> {tickets[0].customerName}</p>
                <p><strong>Quantidade:</strong> {tickets.length} ingresso(s)</p>
              </div>
            </div>
          )}

          {/* PDF Download */}
          {tickets.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4">Baixar Ingressos</h3>
              
              <button
                onClick={downloadAllTicketsPDF}
                disabled={generatingPDF}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    📄 Baixar Todos os Ingressos (PDF)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Event Info */}
          
        </div>

        {/* Tickets Status - No Display */}
        {tickets.length < 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Processando Ingressos</h2>
          <p className="text-gray-600 mb-6">
            Seus ingressos estão sendo processados. Eles aparecerão aqui automaticamente quando estiverem prontos.
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-4 text-center">Instruções Importantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Chegue com antecedência ao evento</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Apresente um documento de identidade junto com o ingresso</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Cada QR Code é válido apenas uma vez</span>
                </li>
              </ul>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Mantenha seus ingressos salvos no celular ou impressos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Em caso de problemas, entre em contato conosco</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </Link>
            <Link 
              href="/eventos"
              className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Ver Outros Eventos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
