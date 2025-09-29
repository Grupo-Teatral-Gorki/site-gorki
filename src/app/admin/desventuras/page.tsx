"use client";

import { useEffect, useMemo, useState } from "react";

interface Item {
  id: string;
  name: string;
  email?: string;
  quantity: number;
  paymentId: string;
  status: string; // always approved from webhook filter
  eventId: string;
  eventTitle?: string;
  createdAt?: string;
}

export default function AdminDesventurasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/desventuras", { cache: "no-store" });
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      console.error(e);
      alert("Falha ao carregar a lista");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items]
  );

  const downloadCSV = () => {
    const header = ["Nome", "Email", "Quantidade", "Pagamento", "Evento", "CriadoEm"];
    const rows = items.map((i) => [
      escapeCsv(i.name || ""),
      escapeCsv(i.email || ""),
      String(i.quantity ?? 0),
      escapeCsv(i.paymentId || ""),
      escapeCsv(i.eventTitle || i.eventId || ""),
      escapeCsv(i.createdAt || ""),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desventuras_relatorio.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-900">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Desventuras – Lista de Compradores</h1>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-gray-100" onClick={load}>Atualizar</button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={downloadCSV}>Exportar CSV</button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">Mostrando apenas pagamentos aprovados (registrados pelo webhook).</p>

        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum registro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Qtd</th>
                  <th className="py-2 pr-4">Pagamento</th>
                  <th className="py-2 pr-4">Evento</th>
                  <th className="py-2 pr-4">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{i.name}</td>
                    <td className="py-2 pr-4">{i.email}</td>
                    <td className="py-2 pr-4">{i.quantity}</td>
                    <td className="py-2 pr-4">{i.paymentId}</td>
                    <td className="py-2 pr-4">{i.eventTitle || i.eventId}</td>
                    <td className="py-2 pr-4">{formatDate(i.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right text-sm font-semibold">
          Total de ingressos: {totalQuantity}
        </div>
      </div>
    </div>
  );
}

function escapeCsv(v: string) {
  if (v == null) return "";
  const needsQuotes = /[",\n;]/.test(v);
  const value = v.replace(/"/g, '""');
  return needsQuotes ? `"${value}"` : value;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}
