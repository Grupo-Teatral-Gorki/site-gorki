"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/dialog";
import { useSiteDataContext } from "@/context/SiteDataContext";
import { Link } from "react-router-dom";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import QRCode from "qrcode";
import MercadoPagoPayment from "./MercadoPagoPayment";

interface EventData {
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  price: string;
  id: string;
}

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

const UpcomingEvents = () => {
  const { siteData, loading } = useSiteDataContext();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [generatedTickets, setGeneratedTickets] = useState<TicketData[]>([]);
  const [showTickets, setShowTickets] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (siteData?.home?.nextEvents) {
      // Sort events from closest to furthest away
      const sortedEvents = [...siteData.home.nextEvents].sort((a, b) => {
        const parse = (str: string) => {
          if (!str || str.trim() === "") return new Date(9999, 11, 31); // Put empty dates at the end
          const [d, m, y] = str.split("-").map(Number);
          if (isNaN(d) || isNaN(m) || isNaN(y)) return new Date(9999, 11, 31); // Invalid dates at the end
          return new Date(y, m - 1, d);
        };
        const dateA = parse(a.date);
        const dateB = parse(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      setEvents(sortedEvents);
    }
  }, [siteData]);

  const calculateTotal = (price: string, quantity: number) => {
    const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(numericPrice) ? 0 : numericPrice * quantity;
  };

  const handleQuantityChange = (increment: boolean) => {
    setTicketQuantity(prev => {
      if (increment) return prev + 1;
      return prev > 1 ? prev - 1 : 1;
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply Brazilian phone mask: (11) 99999-9999
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
      // Limit to 11 digits max
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhoneNumber(value);
    handleInputChange('phone', formattedPhone);
  };

  const generateTickets = async () => {
    if (!selectedEvent) return [];

    const tickets: TicketData[] = [];
    const purchaseDate = new Date().toISOString();

    for (let i = 1; i <= ticketQuantity; i++) {
      const ticketId = `${selectedEvent.id}-${Date.now()}-${i}`;
      
      // Create ticket data for QR code
      const ticketData = {
        ticketId,
        eventTitle: selectedEvent.title,
        eventDate: selectedEvent.date,
        eventLocation: selectedEvent.location,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        ticketNumber: i,
        totalTickets: ticketQuantity,
        purchaseDate,
      };

      try {
        // Create verification URL for QR code
        const verificationUrl = `${window.location.origin}/ticket-verification/${ticketId}`;
        
        // Log URL for easy testing
        console.log(`🎫 Ticket ${i} verification URL:`, verificationUrl);
        
        // Generate QR code with verification URL
        const qrCode = await QRCode.toDataURL(verificationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        tickets.push({
          id: ticketId,
          eventTitle: selectedEvent.title,
          eventDate: selectedEvent.date,
          eventLocation: selectedEvent.location,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          ticketNumber: i,
          qrCode,
          purchaseDate,
        });
      } catch (error) {
        console.error('Error generating QR code for ticket', i, ':', error);
      }
    }

    return tickets;
  };

  const handleCheckout = async () => {
    if (!selectedEvent) return;
    
    // Validate form
    if (!customerInfo.name || !customerInfo.email) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Show payment form
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Generate tickets with QR codes after successful payment
      const tickets = await generateTickets();
      
      // Store tickets in localStorage for verification
      const existingTickets = JSON.parse(localStorage.getItem('generatedTickets') || '[]');
      const allTickets = [...existingTickets, ...tickets];
      localStorage.setItem('generatedTickets', JSON.stringify(allTickets));
      
      // Store payment information
      const paymentInfo = {
        paymentIntentId,
        tickets: tickets.map(t => t.id),
        amount: calculateTotal(selectedEvent!.price, ticketQuantity),
        timestamp: new Date().toISOString(),
      };
      
      const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      localStorage.setItem('payments', JSON.stringify([...existingPayments, paymentInfo]));
      
      setGeneratedTickets(tickets);
      setShowPayment(false);
      setShowTickets(true);
      setPaymentIntentId(paymentIntentId);
      
    } catch (error) {
      console.error('Error generating tickets after payment:', error);
      alert('Pagamento realizado, mas houve erro ao gerar os ingressos. Entre em contato conosco.');
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Erro no pagamento: ${error}`);
    setShowPayment(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };



  if (loading) {
    return (
      <div className="w-full py-8 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-black">
          Próximos Eventos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 relative"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-yellow-500 text-black text-xs font-semibold px-3 py-2 rounded-full shadow-md">
                      {event.date}
                    </span>
                  </div>
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6 flex flex-col h-full">
                    <h3 className="text-xl font-semibold mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-2 flex-1">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-end text-sm text-gray-500 mt-2">
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 bg-white rounded-3xl shadow-2xl border-0 overflow-hidden">
                <DialogTitle className="sr-only">{event.title}</DialogTitle>
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-t-3xl shadow-md"
                  />
                  <span className="absolute top-4 left-4 bg-yellow-500 text-black text-xs font-semibold px-4 py-2 rounded-full shadow-md z-10">
                    {event.date}
                  </span>
                </div>
                <div className="p-8 flex flex-col gap-4">
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 2a1 1 0 00-1 1v1H5a3 3 0 00-3 3v8a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm8 5a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h10z" />
                      </svg>
                      {event.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z" />
                      </svg>
                      {event.location}
                    </span>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    {event.description}
                  </p>
                  <div className="flex justify-end">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <button className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-full shadow hover:bg-yellow-700 transition-colors duration-200 text-base">
                          Comprar Ingresso
                        </button>
                      </DrawerTrigger>
                      <DrawerContent className="max-w-lg ml-auto h-full fixed right-0 top-0 rounded-none rounded-l-2xl shadow-2xl p-0 overflow-y-auto bg-white [&::after]:hidden [&::before]:hidden">
                        <DrawerClose className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 rounded-full p-2 transition-colors hover:bg-gray-50">
                          <span className="text-2xl">&times;</span>
                        </DrawerClose>
                        
                        <div className="p-6 pt-16 bg-gradient-to-b from-gray-50 to-white text-black">

                          {showPayment ? (
                            /* Payment Form */
                            <MercadoPagoPayment
                              amount={calculateTotal(event.price, ticketQuantity)}
                              customerInfo={customerInfo}
                              eventInfo={{
                                title: event.title,
                                date: event.date,
                                location: event.location,
                                price: event.price,
                                id: event.id,
                              }}
                              ticketQuantity={ticketQuantity}
                              onSuccess={handlePaymentSuccess}
                              onError={handlePaymentError}
                              onCancel={handlePaymentCancel}
                            />
                          ) : showTickets ? (
                            /* Tickets Display */
                            <div className="space-y-4">
                              <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-green-600 mb-2">
                                  🎉 Pagamento Confirmado!
                                </h2>
                                <p className="text-gray-600 mb-2">
                                  Seus ingressos foram gerados com sucesso. Apresente o QR code na entrada do evento.
                                </p>
                                {paymentIntentId && (
                                  <p className="text-xs text-gray-500">
                                    ID do Pagamento: {paymentIntentId}
                                  </p>
                                )}
                              </div>
                              
                              {generatedTickets.map((ticket, index) => (
                                <div key={ticket.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                  <div className="flex flex-col items-center space-y-4">
                                    <div className="text-center">
                                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {ticket.eventTitle}
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Ingresso #{ticket.ticketNumber} de {ticketQuantity}
                                      </p>
                                      <div className="space-y-1 text-sm text-gray-500">
                                        <p>📅 {ticket.eventDate}</p>
                                        <p>📍 {ticket.eventLocation}</p>
                                        <p>👤 {ticket.customerName}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <img 
                                        src={ticket.qrCode} 
                                        alt={`QR Code para ingresso ${ticket.ticketNumber}`}
                                        className="w-48 h-48 mx-auto"
                                      />
                                    </div>
                                    
                                    <p className="text-xs text-gray-400 text-center">
                                      ID: {ticket.id}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="flex gap-3 mt-6">
                                <button
                                  onClick={() => {
                                    setShowTickets(false);
                                    setGeneratedTickets([]);
                                    setTicketQuantity(1);
                                    setCustomerInfo({ name: '', email: '', phone: '' });
                                  }}
                                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                                >
                                  Nova Compra
                                </button>
                                <button
                                  onClick={() => window.print()}
                                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                                >
                                  Imprimir Ingressos
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                          {/* Event Header */}
                          <div className="mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold mb-3 text-gray-800">
                              {event.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 2a1 1 0 00-1 1v1H5a3 3 0 00-3 3v8a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
                              </svg>
                              {event.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {event.location}
                            </div>
                          </div>

                          {/* Ticket Selection */}
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Selecionar Ingressos</h3>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <p className="font-semibold text-gray-800">Ingresso Geral</p>
                                  <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-yellow-600">{event.price}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <span className="text-sm font-medium text-gray-600">Quantidade:</span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleQuantityChange(false)}
                                    className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 flex items-center justify-center transition-all duration-200 shadow-sm"
                                    disabled={ticketQuantity <= 1}
                                  >
                                    <span className="text-lg font-bold text-gray-600">-</span>
                                  </button>
                                  <span className="w-12 text-center font-bold text-lg text-gray-800">{ticketQuantity}</span>
                                  <button
                                    onClick={() => handleQuantityChange(true)}
                                    className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 flex items-center justify-center transition-all duration-200 shadow-sm"
                                  >
                                    <span className="text-lg font-bold text-gray-600">+</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Customer Information */}
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Informações do Comprador</h3>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                  Nome Completo *
                                </label>
                                <input
                                  type="text"
                                  value={customerInfo.name}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                                  placeholder="Digite seu nome completo"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                  E-mail *
                                </label>
                                <input
                                  type="email"
                                  value={customerInfo.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                                  placeholder="seu@email.com"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                  Telefone
                                </label>
                                <input
                                  type="tel"
                                  value={customerInfo.phone}
                                  onChange={(e) => handlePhoneChange(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                                  placeholder="(11) 99999-9999"
                                  maxLength={15}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Resumo do Pedido</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Ingresso ({ticketQuantity}x)</span>
                                <span>R$ {calculateTotal(event.price, ticketQuantity).toFixed(2)}</span>
                              </div>
                              <div className="border-t border-yellow-200 pt-3 flex justify-between font-bold text-lg">
                                <span className="text-gray-700">Total</span>
                                <span className="text-yellow-600">R$ {calculateTotal(event.price, ticketQuantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Checkout Button */}
                          <button
                            type="button"
                            onClick={handleCheckout}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                          >
                            Finalizar Compra
                          </button>
                          
                          <p className="text-xs text-gray-400 mt-4 text-center">
                            * Campos obrigatórios
                          </p>
                            </>
                          )}
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
