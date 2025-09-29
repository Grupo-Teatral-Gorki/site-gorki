'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';

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

export default function TicketsPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (paymentId) {
      fetchTickets();
    }
  }, [paymentId]);

  const fetchTickets = async () => {
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
        // Create simple validation URL instead of JSON data
        const validationUrl = `${window.location.origin}/validate/${ticket.ticketId}`;
        
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

  const downloadTicket = (ticket: Ticket) => {
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
          <Link 
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Seus Ingressos
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Pagamento confirmado! Aqui estão seus ingressos digitais.
          </p>
          
          {tickets.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-blue-900 mb-2">Informações do Evento</h2>
              <div className="text-sm text-blue-800">
                <p><strong>Evento:</strong> {tickets[0].eventTitle}</p>
                <p><strong>Data:</strong> {tickets[0].eventDate}</p>
                <p><strong>Local:</strong> {tickets[0].eventLocation}</p>
                <p><strong>Portador:</strong> {tickets[0].customerName}</p>
                <p><strong>Quantidade:</strong> {tickets.length} ingresso(s)</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket, index) => (
            <div key={ticket.ticketId} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <h3 className="font-bold text-lg">Ingresso #{index + 1}</h3>
                <p className="text-sm opacity-90">{ticket.ticketNumber}</p>
              </div>
              
              <div className="p-6 text-center">
                {qrCodes[ticket.ticketId] ? (
                  <div className="mb-4">
                    <img 
                      src={qrCodes[ticket.ticketId]} 
                      alt={`QR Code para ${ticket.ticketNumber}`}
                      className="mx-auto mb-2"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block text-[11px] px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700 font-semibold">
                        {ticket.ticketType === 'meia' ? 'Meia' : 'Inteira'}
                      </span>
                      <span className="text-xs text-gray-500">Apresente este QR Code na entrada</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                <button
                  onClick={() => downloadTicket(ticket)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-2"
                >
                  Baixar Ingresso
                </button>
                
                <p className="text-xs text-gray-500">
                  Válido apenas uma vez
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Instruções Importantes</h3>
            <ul className="text-sm text-yellow-700 text-left space-y-1">
              <li>• Chegue com antecedência ao evento</li>
              <li>• Apresente um documento de identidade junto com o ingresso</li>
              <li>• Cada QR Code é válido apenas uma vez</li>
              <li>• Mantenha seus ingressos salvos no celular ou impressos</li>
              <li>• Em caso de problemas, entre em contato conosco</li>
            </ul>
          </div>
          
          <Link 
            href="/"
            className="inline-block bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
