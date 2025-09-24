"use client";

import React, { useState } from "react";
import QRCode from "qrcode";

interface Ticket {
  ticketId: string;
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  customerName: string;
}

export default function AdminGenerateTicketsPage() {
  const [password, setPassword] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [qrCodes, setQrCodes] = useState<{ [k: string]: string }>({});

  const handleProcess = async () => {
    setError("");
    setStatus("");
    setTickets([]);
    setQrCodes({});

    if (!paymentId || !password) {
      setError("Informe o ID do pagamento e a senha de admin.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, password })
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Erro ao processar pagamento");
        setLoading(false);
        return;
      }

      setStatus(json.status || "");

      // Try fetching tickets from the canonical endpoint
      const tRes = await fetch(`/api/tickets/${paymentId}`, { cache: "no-store" });
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTickets(tJson.tickets || []);

        // Generate QR codes
        const qrMap: { [k: string]: string } = {};
        for (const t of tJson.tickets || []) {
          const validationUrl = `${window.location.origin}/validate/${t.ticketId}`;
          qrMap[t.ticketId] = await QRCode.toDataURL(validationUrl, {
            width: 200,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" }
          });
        }
        setQrCodes(qrMap);
      } else {
        // No tickets yet, show status
        setError("Sem ingressos para este pagamento ainda.");
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao processar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Gerar Ingressos (Suporte)</h1>
        <p className="text-sm text-gray-600 mb-6">Página restrita. Informe a senha de admin e o ID do pagamento para gerar/recuperar ingressos.</p>

        {/* Password Gate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Admin</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Digite a senha"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Pagamento</label>
            <input
              type="text"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 127367866234"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleProcess}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Processando..." : "Processar Pagamento"}
          </button>
        </div>

        {status && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status === 'approved' ? 'bg-green-100 text-green-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Status: {status}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">{error}</div>
        )}

        {tickets.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Ingressos ({tickets.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div key={t.ticketId} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Nº {t.ticketNumber}</p>
                    <p className="font-semibold">{t.eventTitle}</p>
                    <p className="text-sm text-gray-700">{t.eventDate} - {t.eventLocation}</p>
                    <p className="text-sm text-gray-700">Portador: {t.customerName}</p>
                  </div>
                  <div className="flex justify-center">
                    {qrCodes[t.ticketId] ? (
                      <img src={qrCodes[t.ticketId]} alt="QR Code" className="w-40 h-40" />
                    ) : (
                      <div className="w-40 h-40 bg-gray-100 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
