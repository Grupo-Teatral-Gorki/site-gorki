"use client";

import React, { useEffect, useState } from "react";

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
              <button
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={loadPayments}
              >
                Atualizar
              </button>
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
                    className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all" className="text-gray-900">Todos os eventos ({allPayments.length})</option>
                    {uniqueEvents.map((event) => {
                      const count = allPayments.filter(p => p.eventTitle === event).length;
                      return (
                        <option key={event} value={event} className="text-gray-900">
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
                    className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all" className="text-gray-900">Todos os status ({allPayments.length})</option>
                    {uniqueStatuses.map((status) => {
                      const count = allPayments.filter(p => p.status === status).length;
                      return (
                        <option key={status} value={status} className="text-gray-900">
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
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
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
      </div>
    </div>
  );
}
