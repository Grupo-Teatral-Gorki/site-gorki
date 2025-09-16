"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/dialog";
import { useSiteDataContext } from "@/context/SiteDataContext";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import QRCode from "qrcode";
import MercadoPagoPayment from "./MercadoPagoPayment";
import { TicketData } from "@/lib/ticketStore";

interface EventData {
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  price: string;
  priceInteira?: string;
  priceMeia?: string;
  id: string;
}


const UpcomingEvents = () => {
  const { siteData, loading } = useSiteDataContext();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState<'inteira' | 'meia'>('inteira');
  const [ticketSelection, setTicketSelection] = useState<{inteira: number, meia: number}>({inteira: 0, meia: 0});
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

  const calculateTotal = (event: EventData, ticketType: 'inteira' | 'meia', quantity: number) => {
    if (event.priceInteira && event.priceMeia) {
      const price = ticketType === 'inteira' ? parseFloat(event.priceInteira) : parseFloat(event.priceMeia);
      return price * quantity;
    }
    // Fallback to original price if no separate prices
    return parseFloat(event.price.replace('R$ ', '')) * quantity;
  };

  const calculateTotalFromSelection = (event: EventData, selection: {inteira: number, meia: number}) => {
    let total = 0;
    const basePrice = parseFloat(event.price.replace('R$ ', ''));
    
    if (selection.inteira > 0) {
      const inteiraPrice = event.priceInteira ? parseFloat(event.priceInteira) : basePrice;
      total += inteiraPrice * selection.inteira;
    }
    if (selection.meia > 0) {
      const meiaPrice = event.priceMeia ? parseFloat(event.priceMeia) : (basePrice * 0.5);
      total += meiaPrice * selection.meia;
    }
    return total;
  };

  const getTotalTicketCount = (selection: {inteira: number, meia: number}) => {
    return selection.inteira + selection.meia;
  };

  const handleQuantityChange = (increment: boolean) => {
    setTicketQuantity(prev => {
      if (increment) return prev + 1;
      return prev > 1 ? prev - 1 : 1;
    });
  };

  const handleTicketSelectionChange = (type: 'inteira' | 'meia', increment: boolean) => {
    console.log('Button clicked:', type, increment ? 'increment' : 'decrement');
    setTicketSelection(prev => {
      const newSelection = { ...prev };
      if (increment) {
        newSelection[type] += 1;
      } else {
        newSelection[type] = Math.max(0, newSelection[type] - 1);
      }
      console.log('New selection:', newSelection);
      return newSelection;
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
      const _ticketData = {
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
          ticketId: ticketId,
          ticketNumber: i.toString(),
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          eventDate: selectedEvent.date,
          eventLocation: selectedEvent.location,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          paymentId: '',
          externalReference: '',
          ticketIndex: i - 1,
          totalTickets: ticketQuantity,
          ticketType: selectedTicketType,
          generatedAt: purchaseDate,
          isValid: true,
          isUsed: false
        });
      } catch (_error) {
        console.error('Error generating QR code for ticket', i, ':', _error);
      }
    }

    return tickets;
  };

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Check if at least one ticket is selected
    const totalTickets = selectedEvent?.priceInteira && selectedEvent?.priceMeia ? 
      getTotalTicketCount(ticketSelection) : ticketQuantity;
    
    if (totalTickets === 0) {
      alert('Por favor, selecione pelo menos um ingresso.');
      return;
    }
    
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
        tickets: tickets.map(t => t.ticketId),
        amount: calculateTotal(selectedEvent!, selectedTicketType, ticketQuantity),
        timestamp: new Date().toISOString(),
      };
      
      const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      localStorage.setItem('payments', JSON.stringify([...existingPayments, paymentInfo]));
      
      // Close drawer and redirect to success page
      setShowPayment(false);
      setShowTickets(false);
      setGeneratedTickets([]);
      
      // Reset form
      setTicketQuantity(1);
      setSelectedTicketType('inteira');
      setTicketSelection({inteira: 0, meia: 0});
      setCustomerInfo({ name: '', email: '', phone: '' });
      setSelectedEvent(null);
      
      // Redirect to payment success page with payment ID
      window.location.href = `/payment-success?payment_id=${paymentIntentId}`;
      
    } catch (_error) {
      console.error('Error generating tickets after payment:', _error);
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
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {event.title}
                    </h3>
                    <p className="text-gray-800 mb-2 flex-1 font-medium leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-end text-sm text-gray-700 mt-2 font-semibold">
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
                  <div className="flex items-center gap-4 text-sm text-gray-700 mb-2 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 2a1 1 0 00-1 1v1H5a3 3 0 00-3 3v8a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
                      </svg>
                      {event.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {event.location}
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 leading-relaxed mb-4 font-medium">
                    {event.description}
                  </p>
                  <div className="flex justify-end">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <button 
                          className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-full shadow hover:bg-yellow-700 transition-colors duration-200 text-base"
                          onClick={() => {
                            setSelectedEvent(event);
                            setTicketSelection({inteira: 0, meia: 0});
                            setShowPayment(false);
                            setShowTickets(false);
                          }}
                        >
                          Comprar Ingresso
                        </button>
                      </DrawerTrigger>
                      <DrawerContent className="max-w-4xl ml-auto h-full fixed right-0 top-0 rounded-none rounded-l-2xl shadow-2xl p-0 overflow-y-auto bg-white [&::after]:hidden [&::before]:hidden">
                        <DrawerClose className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 rounded-full p-2 transition-colors hover:bg-gray-50">
                          <span className="text-2xl">&times;</span>
                        </DrawerClose>
                        
                        <div className="p-4 pt-12 bg-gradient-to-b from-gray-50 to-white text-black">

                          {showPayment ? (
                            /* Payment Form */
                            <MercadoPagoPayment
                              amount={selectedEvent ? calculateTotalFromSelection(selectedEvent, ticketSelection) : 0}
                              customerInfo={customerInfo}
                              eventInfo={{
                                title: selectedEvent?.title || '',
                                date: selectedEvent?.date || '',
                                location: selectedEvent?.location || '',
                                price: selectedEvent?.price || '',
                                id: selectedEvent?.id || '',
                              }}
                              ticketQuantity={getTotalTicketCount(ticketSelection)}
                              ticketType={ticketSelection.inteira > 0 ? 'inteira' : 'meia'}
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
                              
                              {generatedTickets.map((ticket) => (
                                <div key={ticket.ticketId} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                  <div className="flex flex-col items-center space-y-4">
                                    <div className="text-center mb-3">
                                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {ticket.eventTitle}
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Ingresso #{ticket.ticketNumber} de {ticketQuantity}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Tipo: {ticket.ticketType === 'inteira' ? 'Inteira' : 'Meia'}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
                                      <canvas
                                        ref={(canvas) => {
                                          if (canvas) {
                                            QRCode.toCanvas(canvas, JSON.stringify({
                                              ...ticket,
                                              ticketType: (ticket as any).ticketType || 'inteira'
                                            }), { width: 200, margin: 2 });
                                          }
                                        }}
                                      />
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 mb-2">
                                        {ticket.eventDate} - {ticket.eventLocation}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        ID: {ticket.ticketId}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : selectedEvent ? (
                            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                              {/* Left Column - Event Info and Ticket Selection */}
                              <div className="lg:col-span-1 space-y-4">
                                {/* Event Header */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                  <h2 className="text-xl font-bold mb-2 text-gray-800">
                                    {selectedEvent.title}
                                  </h2>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6 2a1 1 0 00-1 1v1H5a3 3 0 00-3 3v8a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
                                    </svg>
                                    {selectedEvent.date}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    {selectedEvent.location}
                                  </div>
                                </div>

                                {/* Ticket Selection */}
                                <div>
                                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                                    🎫 Selecionar Ingressos
                                  </h3>
                                  
                                  {/* Multiple Ticket Type Selection */}
                                  {true ? (
                                    <div className="space-y-3">
                                      {/* Inteira Tickets */}
                                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                          <div>
                                            <h4 className="text-base font-bold text-gray-800">Ingresso Inteira</h4>
                                            <p className="text-xl font-black text-yellow-600">R$ {(() => {
                                              console.log('Event data:', { price: selectedEvent.price, priceInteira: selectedEvent.priceInteira, priceMeia: selectedEvent.priceMeia });
                                              return selectedEvent.priceInteira ? parseFloat(selectedEvent.priceInteira).toFixed(2) : parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.')).toFixed(2);
                                            })()}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() => handleTicketSelectionChange('inteira', false)}
                                              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-yellow-100 border-2 border-gray-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                                              disabled={ticketSelection.inteira <= 0}
                                            >
                                              <span className="text-lg font-bold text-gray-700">−</span>
                                            </button>
                                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-3 py-2 min-w-[50px]">
                                              <span className="text-lg font-bold text-yellow-800 text-center block">{ticketSelection.inteira}</span>
                                            </div>
                                            <button
                                              onClick={() => handleTicketSelectionChange('inteira', true)}
                                              className="w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200"
                                            >
                                              <span className="text-lg font-bold text-yellow-800">+</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Meia Tickets */}
                                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                          <div>
                                            <h4 className="text-base font-bold text-gray-800">Ingresso Meia</h4>
                                            <p className="text-xs text-gray-500 mb-1">Estudante/Idoso</p>
                                            <p className="text-xl font-black text-yellow-600">R$ {selectedEvent.priceMeia ? parseFloat(selectedEvent.priceMeia).toFixed(2) : (parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.')) * 0.5).toFixed(2)}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() => handleTicketSelectionChange('meia', false)}
                                              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-yellow-100 border-2 border-gray-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                                              disabled={ticketSelection.meia <= 0}
                                            >
                                              <span className="text-lg font-bold text-gray-700">−</span>
                                            </button>
                                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-3 py-2 min-w-[50px]">
                                              <span className="text-lg font-bold text-yellow-800 text-center block">{ticketSelection.meia}</span>
                                            </div>
                                            <button
                                              onClick={() => handleTicketSelectionChange('meia', true)}
                                              className="w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200"
                                            >
                                              <span className="text-lg font-bold text-yellow-800">+</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Single ticket type fallback */
                                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <h4 className="text-base font-bold text-gray-800">Ingresso Geral</h4>
                                          <p className="text-xl font-black text-yellow-600">{selectedEvent?.price || 'R$ 0,00'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => handleQuantityChange(false)}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-yellow-100 border-2 border-gray-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                                            disabled={ticketQuantity <= 1}
                                          >
                                            <span className="text-lg font-bold text-gray-700">−</span>
                                          </button>
                                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-3 py-2 min-w-[50px]">
                                            <span className="text-lg font-bold text-yellow-800 text-center block">{ticketQuantity}</span>
                                          </div>
                                          <button
                                            onClick={() => handleQuantityChange(true)}
                                            className="w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 hover:border-yellow-400 flex items-center justify-center transition-all duration-200"
                                          >
                                            <span className="text-lg font-bold text-yellow-800">+</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column - Customer Info & Order Summary */}
                              <div className="lg:col-span-1 space-y-4">
                                {/* Customer Information */}
                                <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-4 shadow-lg border border-blue-200">
                                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                                    👤 Informações do Comprador
                                  </h3>
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        Nome Completo
                                      </label>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                        </div>
                                        <input
                                          type="text"
                                          value={customerInfo.name}
                                          onChange={(e) => handleInputChange('name', e.target.value)}
                                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium placeholder-gray-400"
                                          placeholder="Digite seu nome completo"
                                          required
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="relative">
                                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        E-mail
                                      </label>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                        </div>
                                        <input
                                          type="email"
                                          value={customerInfo.email}
                                          onChange={(e) => handleInputChange('email', e.target.value)}
                                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium placeholder-gray-400"
                                          placeholder="Digite seu e-mail"
                                          required
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="relative">
                                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                        Telefone
                                        <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                                      </label>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                        </div>
                                        <input
                                          type="tel"
                                          value={customerInfo.phone}
                                          onChange={(e) => handlePhoneChange(e.target.value)}
                                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 bg-white hover:border-gray-300 text-gray-800 font-medium placeholder-gray-400"
                                          placeholder="(11) 99999-9999"
                                          maxLength={15}
                                        />
                                      </div>
                                    </div>                                    
                                  </div>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-lg sticky top-6">
                                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                                    💰 Resumo do Pedido
                                  </h3>
                                  <div className="space-y-3">
                                    {true ? (
                                      <>
                                        {ticketSelection.inteira > 0 && (
                                          <div className="bg-white rounded-xl p-3 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                <span className="font-medium text-gray-700">Ingresso Inteira</span>
                                              </div>
                                              <span className="text-sm text-gray-500">x{ticketSelection.inteira}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm text-gray-600">R$ {selectedEvent.priceInteira ? parseFloat(selectedEvent.priceInteira).toFixed(2) : parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.')).toFixed(2)} cada</span>
                                              <span className="font-semibold text-gray-800">R$ {((selectedEvent.priceInteira ? parseFloat(selectedEvent.priceInteira) : parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.'))) * ticketSelection.inteira).toFixed(2)}</span>
                                            </div>
                                          </div>
                                        )}
                                        {ticketSelection.meia > 0 && (
                                          <div className="bg-white rounded-xl p-3 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                <span className="font-medium text-gray-700">Ingresso Meia</span>
                                              </div>
                                              <span className="text-sm text-gray-500">x{ticketSelection.meia}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm text-gray-600">R$ {selectedEvent.priceMeia ? parseFloat(selectedEvent.priceMeia).toFixed(2) : (parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.')) * 0.5).toFixed(2)} cada</span>
                                              <span className="font-semibold text-gray-800">R$ {((selectedEvent.priceMeia ? parseFloat(selectedEvent.priceMeia) : (parseFloat(selectedEvent.price.replace('R$ ', '').replace(',', '.')) * 0.5)) * ticketSelection.meia).toFixed(2)}</span>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="bg-white rounded-xl p-3 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="font-medium text-gray-700">Ingresso Geral</span>
                                          </div>
                                          <span className="text-sm text-gray-500">x{ticketQuantity}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-gray-600">{selectedEvent?.price || 'R$ 0,00'} cada</span>
                                          <span className="font-semibold text-gray-800">R$ {selectedEvent ? calculateTotal(selectedEvent!, selectedTicketType, ticketQuantity).toFixed(2) : '0.00'}</span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="border-t-2 border-green-300 pt-3 mt-3">
                                      <div className="bg-white rounded-xl p-3 shadow-md border-2 border-green-300">
                                        <div className="text-center mb-3">
                                          <p className="text-2xl font-black text-green-600 mb-2">
                                          R$ {selectedEvent ? calculateTotalFromSelection(selectedEvent!, ticketSelection).toFixed(2) : '0.00'}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            Total {(ticketSelection.inteira + ticketSelection.meia)} ingresso{(ticketSelection.inteira + ticketSelection.meia) > 1 ? 's' : ''}
                                          </p>
                                        </div>
                                        
                                        <button
                                          onClick={handleCheckout}
                                          disabled={
                                            !customerInfo.name || 
                                            !customerInfo.email || 
                                            (ticketSelection.inteira + ticketSelection.meia === 0)
                                          }
                                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                          <div className="flex items-center justify-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span className="text-base">🔒 Finalizar Compra Segura</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                          </div>
                                        </button>
                                        
                                        <div className="mt-3">
                                          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                              <span>Campos obrigatórios</span>
                                            </div>
                                            <div className="w-px h-3 bg-gray-300"></div>
                                            <div className="flex items-center gap-1">
                                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                              </svg>
                                              <span>Pagamento seguro</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
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
