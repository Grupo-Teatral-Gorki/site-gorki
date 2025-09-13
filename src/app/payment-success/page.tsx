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
    
    // Automatically fetch tickets when payment data is available
    if (data.paymentId) {
      fetchTickets(data.paymentId);
    }
  }, [searchParams]);

  const fetchTickets = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/tickets/${paymentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Ingressos não encontrados para este pagamento');
        } else {
          setError('Erro ao carregar ingressos');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTickets(data.tickets);

      // Generate QR codes for each ticket
      const qrCodePromises = data.tickets.map(async (ticket: Ticket) => {
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'https://56ba979fa109.ngrok-free.app' 
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

    canvas.width = 600;
    canvas.height = 800;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INGRESSO DIGITAL', canvas.width / 2, 40);
    ctx.fillText(ticket.eventTitle, canvas.width / 2, 75);

    // Event details
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Data: ${ticket.eventDate}`, 50, 150);
    ctx.fillText(`Local: ${ticket.eventLocation}`, 50, 180);
    ctx.fillText(`Portador: ${ticket.customerName}`, 50, 210);
    ctx.fillText(`Ingresso: ${ticket.ticketNumber}`, 50, 240);

    // QR Code
    const qrCodeImg = new Image();
    qrCodeImg.onload = () => {
      ctx.drawImage(qrCodeImg, (canvas.width - 200) / 2, 300, 200, 200);

      // Instructions
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Apresente este QR Code na entrada do evento', canvas.width / 2, 550);
      ctx.fillText('Válido apenas uma vez', canvas.width / 2, 570);

      // Download
      const link = document.createElement('a');
      link.download = `ingresso-${ticket.ticketNumber}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    qrCodeImg.src = qrCodes[ticket.ticketId];
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
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-gray-600 mb-6">
            Seus ingressos digitais estão prontos! Você pode baixá-los ou enviá-los por e-mail.
          </p>

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
