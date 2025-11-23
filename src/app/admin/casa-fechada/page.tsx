"use client";

import { useEffect, useMemo, useState } from "react";

interface Item {
    id: string;
    name: string;
    email?: string;
    quantity: number; // total tickets purchased
    paymentId: string;
    status: string; // approved | pending | rejected
    eventId: string;
    eventTitle?: string;
    createdAt?: string;
    // From payments collection
    ticketInteiraQty?: number;
    ticketMeiaQty?: number;
    totalAmount?: number;
    eventDate?: string;
    eventLocation?: string;
}

export default function AdminCasaFechadaPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionFilter, setSessionFilter] = useState<string>("");
    const [copiedId, setCopiedId] = useState<string>("");
    const [busy, setBusy] = useState<{ refresh: boolean; csv: boolean; pdf: boolean }>({ refresh: false, csv: false, pdf: false });

    const load = async () => {
        setLoading(true);
        setBusy((b) => ({ ...b, refresh: true }));
        try {
            const res = await fetch("/api/admin/casa-fechada", { cache: "no-store" });
            const json = await res.json();
            setItems(json.items || []);
        } catch (e) {
            console.error(e);
            alert("Falha ao carregar a lista");
        } finally {
            setLoading(false);
            setBusy((b) => ({ ...b, refresh: false }));
        }
    };

    const downloadPDF = async () => {
        setBusy((b) => ({ ...b, pdf: true }));
        try {
            const res = await fetch('/api/admin/casa-fechada/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: filteredItems,
                    generatedAt: new Date().toLocaleString('pt-BR'),
                    title: 'A Casa Fechada – Relatório de Pagamentos'
                }),
            });
            if (!res.ok) throw new Error('Falha ao gerar PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'casa-fechada-relatorio.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Falha ao gerar PDF');
        }
        setBusy((b) => ({ ...b, pdf: false }));
    };

    useEffect(() => {
        load();
    }, []);

    const filteredItems = useMemo(() => {
        const bySession = (i: Item) => {
            if (!sessionFilter) return true;
            const eventDate = i.eventDate || '';
            return eventDate.includes(sessionFilter);
        };
        return items.filter(bySession);
    }, [items, sessionFilter]);

    const totalQuantity = useMemo(
        () => filteredItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
        [filteredItems]
    );

    const totals = useMemo(() => {
        const inteira = filteredItems.reduce((s, i) => s + (Number(i.ticketInteiraQty) || 0), 0);
        const meia = filteredItems.reduce((s, i) => s + (Number(i.ticketMeiaQty) || 0), 0);
        const amount = filteredItems.reduce((s, i) => s + (typeof i.totalAmount === 'number' ? i.totalAmount : 0), 0);
        return { inteira, meia, tickets: totalQuantity, amount };
    }, [filteredItems, totalQuantity]);

    const downloadCSV = () => {
        setBusy((b) => ({ ...b, csv: true }));
        const header = [
            "PagamentoID",
            "Nome",
            "Email",
            "Sessão",
            "QtdTotal",
            "QtdInteira",
            "QtdMeia",
            "Status",
            "ValorTotal",
            "CriadoEm",
        ];
        const rows = filteredItems.map((i) => [
            escapeCsv(i.paymentId || ""),
            escapeCsv(i.name || ""),
            escapeCsv(i.email || ""),
            escapeCsv(i.eventDate || ""),
            String(i.quantity ?? 0),
            String(i.ticketInteiraQty ?? 0),
            String(i.ticketMeiaQty ?? 0),
            escapeCsv(statusLabel(i.status)),
            typeof i.totalAmount === 'number' ? i.totalAmount.toFixed(2) : "",
            escapeCsv(i.createdAt || ""),
        ]);
        const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `casa-fechada-relatorio.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setBusy((b) => ({ ...b, csv: false }));
    };

    // Get unique sessions from items
    const availableSessions = useMemo(() => {
        const sessions = new Set<string>();
        items.forEach(item => {
            if (item.eventDate) {
                sessions.add(item.eventDate);
            }
        });
        return Array.from(sessions).sort();
    }, [items]);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-900">
            <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">A Casa Fechada – Lista de Compradores</h1>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-2 rounded bg-gray-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={load}
                            disabled={busy.refresh}
                        >
                            {busy.refresh ? 'Atualizando...' : 'Atualizar'}
                        </button>
                        <button
                            className="px-3 py-2 rounded bg-blue-600 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={downloadCSV}
                            disabled={busy.csv}
                        >
                            {busy.csv ? 'Gerando CSV...' : 'Exportar CSV'}
                        </button>
                        <button
                            className="px-3 py-2 rounded bg-emerald-600 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={downloadPDF}
                            disabled={busy.pdf}
                        >
                            {busy.pdf ? 'Gerando PDF...' : 'Exportar PDF'}
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">Mostrando apenas pagamentos aprovados (registrados pelo webhook).</p>

                {/* Filter: Session selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Filtrar por Sessão</label>
                        <select
                            value={sessionFilter}
                            onChange={(e) => setSessionFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Todas as sessões</option>
                            {availableSessions.map((session) => (
                                <option key={session} value={session}>
                                    {session}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500">Carregando...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhum registro encontrado.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="text-left">
                                    <th className="px-3 py-2 font-semibold text-gray-700">ID</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Nome</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Email</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Sessão</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Qtd Total</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Inteira</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Meia</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700">Criado em</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map((i) => (
                                    <tr key={i.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-mono text-xs text-gray-700">
                                            <button
                                                className="hover:underline"
                                                title="Copiar ID"
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(i.paymentId || '');
                                                        setCopiedId(i.paymentId || '');
                                                        setTimeout(() => setCopiedId(""), 1500);
                                                    } catch { }
                                                }}
                                            >
                                                {i.paymentId}
                                            </button>
                                            {copiedId === i.paymentId && (
                                                <span className="ml-2 text-[10px] text-green-700">Copiado</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-medium">{i.name}</td>
                                        <td className="px-3 py-2 text-gray-800">{i.email}</td>
                                        <td className="px-3 py-2">{i.eventDate}</td>
                                        <td className="px-3 py-2">{i.quantity}</td>
                                        <td className="px-3 py-2">{i.ticketInteiraQty ?? 0}</td>
                                        <td className="px-3 py-2">{i.ticketMeiaQty ?? 0}</td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(i.status)}`}>
                                                {statusLabel(i.status)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{formatDate(i.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-gray-600">
                        Mostrando {filteredItems.length} pagamento(s)
                    </div>
                    <div className="font-semibold text-right">
                        <span className="mr-4">Inteira: {totals.inteira}</span>
                        <span className="mr-4">Meia: {totals.meia}</span>
                        <span className="mr-4">Total ingressos: {totals.tickets}</span>
                        <span>Valor total: R$ {totals.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
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

function statusBadgeClass(status?: string) {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800 border border-green-200';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    if (s === 'rejected' || s === 'invalid') return 'bg-red-100 text-red-800 border border-red-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
}

function statusLabel(status?: string) {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'Aprovado';
    if (s === 'pending') return 'Pendente';
    if (s === 'rejected' || s === 'invalid') return 'Rejeitado';
    return status || '';
}
