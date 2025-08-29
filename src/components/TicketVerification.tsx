"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface TicketData {
  id: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  customerName: string;
  customerEmail: string;
  ticketNumber: number;
  qrCode: string;
  purchaseDate: string;
}

interface TicketStatus {
  isValid: boolean;
  isUsed: boolean;
  usedAt?: string;
  ticket?: TicketData;
}

const TicketVerification = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (ticketId) {
      verifyTicket(ticketId);
    }
  }, [ticketId]);

  const verifyTicket = async (id: string) => {
    try {
      setLoading(true);
      
      // Check localStorage for ticket data and scan status
      const storedTickets = localStorage.getItem('generatedTickets');
      const scannedTickets = JSON.parse(localStorage.getItem('scannedTickets') || '{}');
      
      if (storedTickets) {
        const tickets: TicketData[] = JSON.parse(storedTickets);
        const ticket = tickets.find(t => t.id === id);
        
        if (ticket) {
          const isUsed = scannedTickets[id] !== undefined;
          setTicketStatus({
            isValid: true,
            isUsed,
            usedAt: scannedTickets[id],
            ticket
          });
        } else {
          setTicketStatus({
            isValid: false,
            isUsed: false
          });
        }
      } else {
        setTicketStatus({
          isValid: false,
          isUsed: false
        });
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setTicketStatus({
        isValid: false,
        isUsed: false
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmEntry = async () => {
    if (!ticketId || !ticketStatus?.ticket) return;
    
    try {
      setConfirming(true);
      
      // Mark ticket as used
      const scannedTickets = JSON.parse(localStorage.getItem('scannedTickets') || '{}');
      scannedTickets[ticketId] = new Date().toISOString();
      localStorage.setItem('scannedTickets', JSON.stringify(scannedTickets));
      
      // Update status
      setTicketStatus(prev => prev ? {
        ...prev,
        isUsed: true,
        usedAt: scannedTickets[ticketId]
      } : null);
      
    } catch (error) {
      console.error('Error confirming entry:', error);
      alert('Erro ao confirmar entrada. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando ingresso...</p>
        </div>
      </div>
    );
  }

  if (!ticketStatus?.isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ingresso Inválido</h1>
          <p className="text-gray-600 mb-6">
            Este QR code não corresponde a um ingresso válido.
          </p>
          <p className="text-sm text-gray-500">
            Verifique se o código está correto ou entre em contato com o organizador do evento.
          </p>
        </div>
      </div>
    );
  }

  if (ticketStatus.isUsed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-orange-600 mb-2">Ingresso Já Utilizado</h1>
          <p className="text-gray-600 mb-4">
            Este ingresso já foi escaneado e utilizado.
          </p>
          
          {ticketStatus.ticket && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">{ticketStatus.ticket.eventTitle}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📅 {ticketStatus.ticket.eventDate}</p>
                <p>📍 {ticketStatus.ticket.eventLocation}</p>
                <p>🎫 Ingresso #{ticketStatus.ticket.ticketNumber}</p>
                <p>👤 {ticketStatus.ticket.customerName}</p>
              </div>
            </div>
          )}
          
          {ticketStatus.usedAt && (
            <p className="text-sm text-gray-500">
              Utilizado em: {new Date(ticketStatus.usedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-green-600 mb-2">Ingresso Válido</h1>
        <p className="text-gray-600 mb-6">
          Este ingresso está válido e pronto para entrada.
        </p>
        
        {ticketStatus.ticket && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">{ticketStatus.ticket.eventTitle}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📅 {ticketStatus.ticket.eventDate}</p>
              <p>📍 {ticketStatus.ticket.eventLocation}</p>
              <p>🎫 Ingresso #{ticketStatus.ticket.ticketNumber}</p>
              <p>👤 {ticketStatus.ticket.customerName}</p>
              <p>📧 {ticketStatus.ticket.customerEmail}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={confirmEntry}
          disabled={confirming}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
        >
          {confirming ? 'Confirmando...' : 'Confirmar Entrada'}
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Clique para confirmar a entrada no evento
        </p>
      </div>
    </div>
  );
};

export default TicketVerification;
