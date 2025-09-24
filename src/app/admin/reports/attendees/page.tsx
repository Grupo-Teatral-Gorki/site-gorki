"use client";

import React, { useState } from "react";

export default function AdminAttendeesReportPage() {
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const downloadCsv = async () => {
    setError("");
    if (!password) {
      setError("Digite a senha de admin.");
      return;
    }
    try {
      setDownloading(true);
      const res = await fetch(`/api/admin/attendees-report?password=${encodeURIComponent(password)}`, {
        cache: 'no-store'
      });
      if (!res.ok) {
        const t = await res.text();
        setError(t || 'Erro ao gerar relatório');
        setDownloading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'relatorio-participantes.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Erro ao baixar o relatório');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Relatório de Participantes</h1>
        <p className="text-sm text-gray-600 mb-6">Baixe a lista de nomes e quantidade de ingressos por evento.</p>

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
            <button
              onClick={downloadCsv}
              disabled={downloading}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
            >
              {downloading ? 'Gerando...' : 'Baixar CSV'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">{error}</div>
        )}

        <div className="text-sm text-gray-500">
          O CSV terá as colunas: Evento, Data, Local, Nome, Quantidade.
        </div>
      </div>
    </div>
  );
}
