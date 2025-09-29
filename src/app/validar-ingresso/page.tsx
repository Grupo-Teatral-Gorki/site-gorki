'use client';

import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

interface ValidationResult {
  valid: boolean;
  message: string;
  status: string;
  ticketInfo?: {
    ticketNumber: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    customerName: string;
    ticketIndex: number;
    totalTickets: number;
    validatedAt?: string;
    usedAt?: string;
  };
}

export default function ValidateTicketPage() {
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);

    const newScanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    newScanner.render(onScanSuccess, onScanFailure);
    setScanner(newScanner);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    validateTicket(decodedText);
    stopScanning();
  };

  const onScanFailure = (error: any) => {
    // Handle scan failure silently
  };

  const validateTicket = async (qrData: string) => {
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      const result: ValidationResult = await response.json();
      setScanResult(result);
    } catch (error) {
      setScanResult({
        valid: false,
        message: 'Erro ao validar ingresso. Tente novamente.',
        status: 'error'
      });
    }
  };

  const validateManualCode = () => {
    if (manualCode.trim()) {
      validateTicket(manualCode.trim());
      setManualCode('');
    }
  };

  const resetValidation = () => {
    setScanResult(null);
    setManualCode('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-900">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Validar Ingresso
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Escaneie o QR Code do ingresso para validar a entrada
          </p>

          {!scanResult && (
            <div className="space-y-6">
              {/* QR Code Scanner */}
              <div className="text-center">
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-.01M12 12v1m2 5h1m-4 0h2m-6-4h1m1-4h1.01M8 16h2.01" />
                    </svg>
                    Iniciar Scanner
                  </button>
                ) : (
                  <div>
                    <div id="qr-reader" className="mb-4"></div>
                    <button
                      onClick={stopScanning}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Parar Scanner
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Inserir Código Manualmente</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Cole o código do QR aqui..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={validateManualCode}
                    disabled={!manualCode.trim()}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Validar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Result */}
          {scanResult && (
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                scanResult.valid 
                  ? 'bg-green-100' 
                  : scanResult.status === 'already_used'
                  ? 'bg-orange-100'
                  : 'bg-red-100'
              }`}>
                {scanResult.valid ? (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : scanResult.status === 'already_used' ? (
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h2 className={`text-2xl font-bold mb-2 ${
                scanResult.valid 
                  ? 'text-green-600' 
                  : scanResult.status === 'already_used'
                  ? 'text-orange-600'
                  : 'text-red-600'
              }`}>
                {scanResult.valid ? 'ENTRADA AUTORIZADA' : 
                 scanResult.status === 'already_used' ? 'INGRESSO JÁ UTILIZADO' : 'ENTRADA NEGADA'}
              </h2>

              <p className="text-gray-700 mb-6 text-lg">
                {scanResult.message}
              </p>

              {scanResult.ticketInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Ingresso</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Número:</strong> {scanResult.ticketInfo.ticketNumber}</p>
                    <p><strong>Evento:</strong> {scanResult.ticketInfo.eventTitle}</p>
                    <p><strong>Data:</strong> {scanResult.ticketInfo.eventDate}</p>
                    <p><strong>Local:</strong> {scanResult.ticketInfo.eventLocation}</p>
                    <p><strong>Portador:</strong> {scanResult.ticketInfo.customerName}</p>
                    <p><strong>Ingresso:</strong> {scanResult.ticketInfo.ticketIndex} de {scanResult.ticketInfo.totalTickets}</p>
                    {scanResult.ticketInfo.validatedAt && (
                      <p><strong>Validado em:</strong> {new Date(scanResult.ticketInfo.validatedAt).toLocaleString('pt-BR')}</p>
                    )}
                    {scanResult.ticketInfo.usedAt && (
                      <p><strong>Usado em:</strong> {new Date(scanResult.ticketInfo.usedAt).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Removed: 'Validar Outro Ingresso' button as requested */}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Como Usar</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Clique em "Iniciar Scanner" para ativar a câmera</li>
            <li>• Aponte a câmera para o QR Code do ingresso</li>
            <li>• O sistema validará automaticamente o ingresso</li>
            <li>• Ingressos válidos serão marcados como usados</li>
            <li>• Ingressos já utilizados serão rejeitados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
