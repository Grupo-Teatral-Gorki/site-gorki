"use client";

import React, { useEffect, useState } from "react";

interface TicketSummary {
  customerName: string;
  eventTitle: string;
  eventDate: string;
  totalTickets: number;
  paymentId: string;
}

export default function AdminPaymentsPage() {
  const [ticketSummaries, setTicketSummaries] = useState<TicketSummary[]>([]);
  const [allSummaries, setAllSummaries] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/admin/tickets', { cache: 'no-store' });
      if (!res.ok) {
        const errorText = await res.text();
        setError(`Erro ao carregar ingressos: ${res.status} - ${errorText}`);
        setTicketSummaries([]);
        return;
      }
      const json = await res.json();
      const tickets = json.tickets || [];

      // Group tickets by paymentId to get summaries
      const summaryMap = new Map<string, TicketSummary>();
      tickets.forEach((ticket: any) => {
        if (!summaryMap.has(ticket.paymentId)) {
          summaryMap.set(ticket.paymentId, {
            customerName: ticket.customerName,
            eventTitle: ticket.eventTitle,
            eventDate: ticket.eventDate,
            totalTickets: ticket.totalTickets || 0,
            paymentId: ticket.paymentId,
          });
        }
      });

      const summaries = Array.from(summaryMap.values());
      setAllSummaries(summaries);
      setTicketSummaries(summaries);
    } catch (e: any) {
      setError(`Erro de rede: ${e.message}`);
      setTicketSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filter tickets when event selection changes
  useEffect(() => {
    if (selectedEvent === "all") {
      setTicketSummaries(allSummaries);
    } else {
      setTicketSummaries(allSummaries.filter(s => s.eventTitle === selectedEvent));
    }
  }, [selectedEvent, allSummaries]);

  // Get unique event titles for filter
  const uniqueEvents = Array.from(new Set(allSummaries.map(s => s.eventTitle))).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ingressos Vendidos</h1>
          <p className="text-sm text-gray-600 mt-1">Lista de todos os clientes e ingressos comprados</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Resumo de Vendas</h2>
              <button
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={loadTickets}
              >
                Atualizar
              </button>
            </div>

            {/* Event Filter */}
            {uniqueEvents.length > 0 && (
              <div className="flex items-center gap-3">
                <label htmlFor="event-filter" className="text-sm font-medium text-gray-900">
                  Filtrar por evento:
                </label>
                <select
                  id="event-filter"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="flex-1 max-w-md px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all" className="text-gray-900">Todos os eventos ({allSummaries.length})</option>
                  {uniqueEvents.map((event) => {
                    const count = allSummaries.filter(s => s.eventTitle === event).length;
                    return (
                      <option key={event} value={event} className="text-gray-900">
                        {event} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : ticketSummaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum ingresso vendido ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Cliente</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Evento</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Data</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Ingressos</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ticketSummaries.map((summary) => (
                      <tr key={summary.paymentId} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{summary.customerName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-700">{summary.eventTitle}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">{summary.eventDate}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {summary.totalTickets}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={`/payment-success?payment_id=${encodeURIComponent(summary.paymentId)}`}
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

          {!loading && ticketSummaries.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total de vendas:</span>
                <span className="font-semibold text-gray-900">
                  {ticketSummaries.length} {ticketSummaries.length === 1 ? 'venda' : 'vendas'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Total de ingressos:</span>
                <span className="font-semibold text-gray-900">
                  {ticketSummaries.reduce((sum, s) => sum + s.totalTickets, 0)} ingressos
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
