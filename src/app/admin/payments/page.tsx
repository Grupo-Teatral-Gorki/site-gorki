"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSiteData } from "@/hooks/useSiteData";

interface Payment {
  paymentId: string;
  status: string;
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketQuantity: number;
  ticketInteiraQty?: number;
  ticketMeiaQty?: number;
  totalAmount: number;
  notes?: string;
  isManual?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Load site data for events
  const { siteData } = useSiteData();

  // Manual ticket generation state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [manualForm, setManualForm] = useState({
    customerName: "",
    customerEmail: "",
    ticketInteiraQty: 0,
    ticketMeiaQty: 0,
    notes: ""
  });

  const loadPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/admin/payments', { cache: 'no-store' });
      if (!res.ok) {
        const errorText = await res.text();
        setError(`Erro ao carregar pagamentos: ${res.status} - ${errorText}`);
        setPayments([]);
        return;
      }
      const json = await res.json();
      const paymentsData = json.payments || [];
      setAllPayments(paymentsData);
      setPayments(paymentsData);
    } catch (e: any) {
      setError(`Erro de rede: ${e.message}`);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Get events from siteData and add Casa Fechada sessions
  const siteEvents = siteData?.home?.nextEvents || [];

  // Add Casa Fechada sessions as separate event options
  const casaFechadaSessions = [
    {
      id: "casa-fechada-001-13-12",
      title: "A Casa Fechada",
      date: "13-12-2025",
      displayDate: "13 de Dezembro de 2025 - 20:00",
      location: "Arena Porão",
      price: "R$ 40,00",
      priceInteira: "40.00",
      priceMeia: "20.00",
    },
    {
      id: "casa-fechada-001-14-12",
      title: "A Casa Fechada",
      date: "14-12-2025",
      displayDate: "14 de Dezembro de 2025 - 20:00",
      location: "Arena Porão",
      price: "R$ 40,00",
      priceInteira: "40.00",
      priceMeia: "20.00",
    },
  ];

  // Combine site events with Casa Fechada sessions
  const events = [...siteEvents, ...casaFechadaSessions];


  // Filter payments when event or status selection changes
  useEffect(() => {
    let filtered = allPayments;

    if (selectedEvent !== "all") {
      filtered = filtered.filter(p => p.eventTitle === selectedEvent);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    setPayments(filtered);
  }, [selectedEvent, selectedStatus, allPayments]);

  // Get unique event titles and statuses for filters
  const uniqueEvents = Array.from(new Set(allPayments.map(p => p.eventTitle))).sort();
  const uniqueStatuses = Array.from(new Set(allPayments.map(p => p.status))).sort();


  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle manual ticket generation
  const handleManualGeneration = async () => {
    if (selectedEventIds.length === 0 || !manualForm.customerName || !manualForm.customerEmail) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const totalTickets = manualForm.ticketInteiraQty + manualForm.ticketMeiaQty;
    if (totalTickets === 0) {
      alert('Por favor, selecione pelo menos 1 ingresso.');
      return;
    }

    setManualLoading(true);
    try {
      // Generate tickets for each selected event
      const allTickets: any[] = [];
      const allQrCodes: Record<string, string> = {};

      for (const eventId of selectedEventIds) {
        const selectedEventData = events.find((e: any) => e.id === eventId);
        if (!selectedEventData) {
          console.error(`Event ${eventId} not found`);
          continue;
        }

        // Generate a unique payment ID for manual tickets for this event
        const manualPaymentId = `MANUAL-${eventId}-${Date.now()}`;
        const externalReference = `manual-${eventId}-${Date.now()}`;

        // Calculate total amount
        const priceInteira = parseFloat((selectedEventData as any).priceInteira || selectedEventData.price || '0');
        const priceMeia = parseFloat((selectedEventData as any).priceMeia || (priceInteira / 2).toString() || '0');
        const totalAmount = (manualForm.ticketInteiraQty * priceInteira) + (manualForm.ticketMeiaQty * priceMeia);

        // Generate tickets via API
        const generateRes = await fetch('/api/tickets/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: manualPaymentId,
            externalReference,
            customerInfo: {
              name: manualForm.customerName,
              email: manualForm.customerEmail
            },
            eventInfo: {
              id: selectedEventData.id,
              title: selectedEventData.title,
              date: (selectedEventData as any).displayDate || selectedEventData.date,
              location: selectedEventData.location
            },
            ticketQuantity: totalTickets,
            ticketInteiraQty: manualForm.ticketInteiraQty,
            ticketMeiaQty: manualForm.ticketMeiaQty,
            totalAmount,
            notes: manualForm.notes
          })
        });

        if (!generateRes.ok) {
          const errorData = await generateRes.json();
          alert(`Erro ao gerar ingressos para ${selectedEventData.title}: ${errorData.error || generateRes.status}`);
          continue;
        }

        const { tickets } = await generateRes.json();
        allTickets.push(...tickets);

        // Generate QR codes
        for (const ticket of tickets) {
          const validationUrl = `${window.location.origin}/validate/${ticket.ticketId}`;
          allQrCodes[ticket.ticketId] = await QRCode.toDataURL(validationUrl, {
            width: 200,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
          });
        }
      }

      // Send tickets via email (no PDF download)
      try {
        const emailRes = await fetch('/api/tickets/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: `MANUAL-${Date.now()}`,
            email: manualForm.customerEmail,
            tickets: allTickets,
            qrCodes: allQrCodes
          })
        });

        if (emailRes.ok) {
          alert(`Ingressos gerados com sucesso!\nTotal: ${allTickets.length} ingressos para ${selectedEventIds.length} evento(s)\nE-mail enviado para ${manualForm.customerEmail}`);
        } else {
          alert(`Ingressos criados, mas houve erro ao enviar o e-mail.\nTotal: ${allTickets.length} ingressos para ${selectedEventIds.length} evento(s)\nPor favor, verifique o console para mais detalhes.`);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        alert(`Ingressos criados, mas houve erro ao enviar o e-mail.\nTotal: ${allTickets.length} ingressos para ${selectedEventIds.length} evento(s)\nErro: ${emailError}`);
      }

      // Reset form and close modal
      setSelectedEventIds([]);
      setManualForm({
        customerName: "",
        customerEmail: "",
        ticketInteiraQty: 0,
        ticketMeiaQty: 0,
        notes: ""
      });
      setShowManualModal(false);

      // Reload payments to show the new manual entry
      loadPayments();
    } catch (e: any) {
      console.error('Error generating manual tickets:', e);
      alert(`Erro ao gerar ingressos: ${e.message}`);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-sm text-gray-600 mt-1">Visualize todos os pagamentos e suas informações</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-1">Erro</h3>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-600">
              Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Pagamentos</h2>
              <div className="flex gap-2">
                <button
                  className="text-sm px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                  onClick={() => setShowManualModal(true)}
                >
                  + Gerar Ingressos Manualmente
                </button>
                <button
                  className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={loadPayments}
                >
                  Atualizar
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Filter */}
              {uniqueEvents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="event-filter" className="text-sm font-medium text-gray-900">
                    Filtrar por evento:
                  </label>
                  <select
                    id="event-filter"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="px-3 py-2 text-sm text-foreground bg-background border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600"
                  >
                    <option value="all">Todos os eventos ({allPayments.length})</option>
                    {uniqueEvents.map((event) => {
                      const count = allPayments.filter(p => p.eventTitle === event).length;
                      return (
                        <option key={event} value={event}>
                          {event} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              {uniqueStatuses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium text-gray-900">
                    Filtrar por status:
                  </label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 text-sm text-foreground bg-background border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600"
                  >
                    <option value="all">Todos os status ({allPayments.length})</option>
                    {uniqueStatuses.map((status) => {
                      const count = allPayments.filter(p => p.status === status).length;
                      return (
                        <option key={status} value={status}>
                          {status} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum pagamento encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Cliente</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Evento</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Ingressos</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Valor</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Data</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((payment) => (
                      <tr key={payment.paymentId} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{payment.customerName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">{payment.customerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-700">{payment.eventTitle}</div>
                          <div className="text-xs text-gray-500">{payment.eventDate}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {payment.ticketQuantity}
                            </span>
                            {(payment.ticketInteiraQty || payment.ticketMeiaQty) && (
                              <div className="text-xs text-gray-500">
                                {payment.ticketInteiraQty ? `${payment.ticketInteiraQty}I ` : ''}
                                {payment.ticketMeiaQty ? `${payment.ticketMeiaQty}M` : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(payment.totalAmount)}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                            {payment.isManual && (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Manual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-600">{formatDate(payment.createdAt)}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={`/payment-success?payment_id=${encodeURIComponent(payment.paymentId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            Ver Ingressos
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && payments.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total de pagamentos:</span>
                  <span className="font-semibold text-gray-900">
                    {payments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total de ingressos:</span>
                  <span className="font-semibold text-gray-900">
                    {payments.reduce((sum, p) => sum + p.ticketQuantity, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valor total:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.totalAmount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Ticket Generation Modal */}
        {showManualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Gerar Ingressos Manualmente</h2>
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use esta opção para casos especiais, cortesias ou correções.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Event Selection - Multi-select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eventos <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                    {!siteData ? (
                      <p className="text-sm text-gray-500">Carregando eventos...</p>
                    ) : events.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum evento disponível</p>
                    ) : (
                      events.map((event: any) => (
                        <label key={event.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEventIds.includes(event.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEventIds([...selectedEventIds, event.id]);
                              } else {
                                setSelectedEventIds(selectedEventIds.filter(id => id !== event.id));
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">
                            {event.title} - {event.displayDate || event.date}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedEventIds.length > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      {selectedEventIds.length} evento(s) selecionado(s)
                    </p>
                  )}
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    placeholder="Digite o nome completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground bg-background dark:border-gray-600"
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={manualForm.customerEmail}
                    onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground bg-background dark:border-gray-600"
                  />
                </div>

                {/* Ticket Quantities */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Inteira
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.ticketInteiraQty}
                      onChange={(e) => setManualForm({ ...manualForm, ticketInteiraQty: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground bg-background dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Meia
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.ticketMeiaQty}
                      onChange={(e) => setManualForm({ ...manualForm, ticketMeiaQty: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground bg-background dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder="Ex: Cortesia, Correção de pedido, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground bg-background dark:border-gray-600"
                  />
                </div>

                {/* Summary */}
                {(manualForm.ticketInteiraQty > 0 || manualForm.ticketMeiaQty > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Resumo</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>Total de ingressos: <strong>{manualForm.ticketInteiraQty + manualForm.ticketMeiaQty}</strong></p>
                      {manualForm.ticketInteiraQty > 0 && <p>Inteira: {manualForm.ticketInteiraQty}</p>}
                      {manualForm.ticketMeiaQty > 0 && <p>Meia: {manualForm.ticketMeiaQty}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowManualModal(false)}
                  disabled={manualLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleManualGeneration}
                  disabled={manualLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {manualLoading ? 'Gerando...' : 'Gerar Ingressos'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
