"use client";

import React, { useEffect, useState } from "react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [tickets, setTickets] = useState<any[]>([]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', { cache: 'no-store' });
      const json = await res.json();
      setPayments(json.payments || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    try {
      const res = await fetch(`/api/admin/tickets?paymentId=${encodeURIComponent(paymentId)}`, { cache: 'no-store' });
      const json = await res.json();
      setTickets(json.tickets || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Pagamentos</h2>
            <button className="text-sm px-3 py-1 rounded bg-gray-100" onClick={loadPayments}>Atualizar</button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-500">Carregando...</div>
          ) : (
            <ul className="divide-y">
              {(payments || []).map((p) => (
                <li key={p.paymentId} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.eventTitle}</div>
                    <div className="text-xs text-gray-500">{p.customerName} • {p.eventDate} • {p.paymentId}</div>
                  </div>
                  <button className="text-blue-600 text-sm" onClick={() => loadTickets(p.paymentId)}>Ver Ingressos</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Ingressos {selectedPaymentId && (<span className="text-gray-500 text-sm">({selectedPaymentId})</span>)}</h2>
            {selectedPaymentId && (
              <a href={`/payment-success?payment_id=${encodeURIComponent(selectedPaymentId)}`} className="text-sm px-3 py-1 rounded bg-blue-600 text-white">Abrir Página de Download</a>
            )}
          </div>
          {tickets.length === 0 ? (
            <div className="text-sm text-gray-500">Selecione um pagamento para ver os ingressos.</div>
          ) : (
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.ticketId} className="py-2">
                  <div className="font-medium">{t.ticketNumber}</div>
                  <div className="text-xs text-gray-500">{t.customerName} • {t.eventTitle} • {t.eventDate} • {t.eventLocation}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
