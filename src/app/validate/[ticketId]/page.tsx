'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

interface TicketInfo {
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  customerName: string;
  ticketIndex: number;
  totalTickets: number;
  isUsed: boolean;
  usedAt?: string;
}

export default function ValidateTicket() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    ticketInfo?: TicketInfo;
    status?: string;
  } | null>(null);

  const handleValidation = async () => {
    if (!password.trim()) {
      alert('Digite a senha de validação');
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/tickets/validate-with-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          password: password.trim()
        }),
      });

      const result = await response.json();
      setValidationResult(result);
      
      if (result.success) {
        setPassword(''); // Clear password on success
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        success: false,
        message: 'Erro de conexão. Tente novamente.',
        status: 'error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Validação de Ingresso
            </h1>
            <p className="text-gray-600 text-sm">
              ID: {ticketId?.substring(0, 8)}...
            </p>
          </div>

          {!validationResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha de Validação:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleValidation()}
                  autoFocus
                />
              </div>

              <button
                onClick={handleValidation}
                disabled={isValidating || !password.trim()}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors text-lg"
              >
                {isValidating ? 'Validando...' : '✅ Validar Ingresso'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Apenas funcionários autorizados podem validar ingressos
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className={`p-6 rounded-lg mb-6 ${
                validationResult.success 
                  ? 'bg-green-100 border border-green-300' 
                  : validationResult.status === 'used'
                  ? 'bg-yellow-100 border border-yellow-300'
                  : 'bg-red-100 border border-red-300'
              }`}>
                <div className={`text-6xl mb-4 ${
                  validationResult.success 
                    ? 'text-green-600' 
                    : validationResult.status === 'used'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {validationResult.success ? '✅' : validationResult.status === 'used' ? '⚠️' : '❌'}
                </div>
                
                <h2 className={`text-xl font-bold mb-2 ${
                  validationResult.success 
                    ? 'text-green-800' 
                    : validationResult.status === 'used'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {validationResult.message}
                </h2>

                {validationResult.ticketInfo && (
                  <div className="bg-white p-4 rounded-lg text-left mt-4">
                    <h3 className="font-bold text-lg mb-2">Informações do Ingresso:</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Número:</strong> {validationResult.ticketInfo.ticketNumber}</p>
                      <p><strong>Evento:</strong> {validationResult.ticketInfo.eventTitle}</p>
                      <p><strong>Data:</strong> {validationResult.ticketInfo.eventDate}</p>
                      <p><strong>Local:</strong> {validationResult.ticketInfo.eventLocation}</p>
                      <p><strong>Portador:</strong> {validationResult.ticketInfo.customerName}</p>
                      <p><strong>Ingresso:</strong> {validationResult.ticketInfo.ticketIndex} de {validationResult.ticketInfo.totalTickets}</p>
                      {validationResult.ticketInfo.usedAt && (
                        <p><strong>Usado em:</strong> {new Date(validationResult.ticketInfo.usedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Removed: 'Validar Outro Ingresso' button as requested */}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">Como usar:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Escaneie o QR Code com a câmera do celular</li>
            <li>• Digite a senha de validação fornecida</li>
            <li>• ✅ Verde = Entrada autorizada</li>
            <li>• ⚠️ Amarelo = Ingresso já foi usado</li>
            <li>• ❌ Vermelho = Ingresso inválido ou senha incorreta</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
