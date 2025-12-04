"use client";

import React, { useEffect, useState } from "react";

interface Transaction {
    id: string;
    transactionId: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    ticketQuantity: number;
    ticketInteiraQty?: number;
    ticketMeiaQty?: number;
    totalAmount: number;
    paymentId?: string;
    paymentType?: string;
    createdAt: string;
    updatedAt: string;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const loadTransactions = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch('/api/admin/transactions', { cache: 'no-store' });
            if (!res.ok) {
                const errorText = await res.text();
                setError(`Erro ao carregar transações: ${res.status} - ${errorText}`);
                setTransactions([]);
                return;
            }
            const json = await res.json();
            const transactionsData = json.transactions || [];
            setAllTransactions(transactionsData);
            setTransactions(transactionsData);
        } catch (e: any) {
            setError(`Erro de rede: ${e.message}`);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    // Filter transactions when event or status selection changes
    useEffect(() => {
        let filtered = allTransactions;

        if (selectedEvent !== "all") {
            filtered = filtered.filter(t => t.eventTitle === selectedEvent);
        }

        if (selectedStatus !== "all") {
            filtered = filtered.filter(t => t.status === selectedStatus);
        }

        setTransactions(filtered);
    }, [selectedEvent, selectedStatus, allTransactions]);

    // Get unique event titles and statuses for filters
    const uniqueEvents = Array.from(new Set(allTransactions.map(t => t.eventTitle))).sort();
    const uniqueStatuses = Array.from(new Set(allTransactions.map(t => t.status))).sort();

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
            case 'aprovado':
                return 'bg-green-100 text-green-800';
            case 'aguardando_pagamento':
                return 'bg-blue-100 text-blue-800';
            case 'pendente':
                return 'bg-yellow-100 text-yellow-800';
            case 'recusado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status display text
    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'aprovado':
                return 'Aprovado';
            case 'aguardando_pagamento':
                return 'Aguardando Pagamento';
            case 'pendente':
                return 'Pendente';
            case 'recusado':
                return 'Recusado';
            default:
                return status;
        }
    };

    // Calculate statistics
    const stats = {
        total: transactions.length,
        aprovado: transactions.filter(t => t.status === 'aprovado').length,
        aguardando: transactions.filter(t => t.status === 'aguardando_pagamento').length,
        pendente: transactions.filter(t => t.status === 'pendente').length,
        recusado: transactions.filter(t => t.status === 'recusado').length,
        totalRevenue: transactions
            .filter(t => t.status === 'aprovado')
            .reduce((sum, t) => sum + t.totalAmount, 0),
        totalTickets: transactions
            .filter(t => t.status === 'aprovado')
            .reduce((sum, t) => sum + t.ticketQuantity, 0),
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Todas as Transações</h1>
                    <p className="text-sm text-gray-600 mt-1">Histórico completo de todas as tentativas de pagamento</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow p-4">
                        <div className="text-sm text-green-700">Aprovados</div>
                        <div className="text-2xl font-bold text-green-900">{stats.aprovado}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow p-4">
                        <div className="text-sm text-blue-700">Aguardando</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.aguardando}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow p-4">
                        <div className="text-sm text-yellow-700">Pendentes</div>
                        <div className="text-2xl font-bold text-yellow-900">{stats.pendente}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow p-4">
                        <div className="text-sm text-red-700">Recusados</div>
                        <div className="text-2xl font-bold text-red-900">{stats.recusado}</div>
                    </div>
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
                            <h2 className="text-lg font-semibold text-gray-900">Lista de Transações</h2>
                            <button
                                className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                onClick={loadTransactions}
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
                                        <option value="all" className="text-gray-900">Todos os eventos ({allTransactions.length})</option>
                                        {uniqueEvents.map((event) => {
                                            const count = allTransactions.filter(t => t.eventTitle === event).length;
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
                                        <option value="all" className="text-gray-900">Todos os status ({allTransactions.length})</option>
                                        {uniqueStatuses.map((status) => {
                                            const count = allTransactions.filter(t => t.status === status).length;
                                            return (
                                                <option key={status} value={status} className="text-gray-900">
                                                    {getStatusText(status)} ({count})
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
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Nenhuma transação encontrada.</div>
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
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{transaction.customerName}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-600">{transaction.customerEmail}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-700">{transaction.eventTitle}</div>
                                                    <div className="text-xs text-gray-500">{transaction.eventDate}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                                            {transaction.ticketQuantity}
                                                        </span>
                                                        {(transaction.ticketInteiraQty || transaction.ticketMeiaQty) && (
                                                            <div className="text-xs text-gray-500">
                                                                {transaction.ticketInteiraQty ? `${transaction.ticketInteiraQty}I ` : ''}
                                                                {transaction.ticketMeiaQty ? `${transaction.ticketMeiaQty}M` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="font-semibold text-gray-900">{formatCurrency(transaction.totalAmount)}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                        {getStatusText(transaction.status)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {transaction.paymentId && transaction.status === 'aprovado' ? (
                                                        <a
                                                            href={`/payment-success?payment_id=${encodeURIComponent(transaction.paymentId)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                                        >
                                                            Ver Ingressos
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {!loading && transactions.length > 0 && (
                        <div className="border-t p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Transações exibidas:</span>
                                    <span className="font-semibold text-gray-900">
                                        {transactions.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Ingressos aprovados:</span>
                                    <span className="font-semibold text-gray-900">
                                        {stats.totalTickets}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Receita aprovada:</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(stats.totalRevenue)}
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
