"use client";
import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Initialize MercadoPago SDK
if (typeof window !== 'undefined') {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
    locale: 'pt-BR'
  });
}

interface MercadoPagoPaymentProps {
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  eventInfo: {
    title: string;
    date: string;
    location: string;
    price: string;
    id: string;
  };
  ticketQuantity: number;
  ticketType?: 'inteira' | 'meia';
  breakdown?: { inteira: number; meia: number };
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const MercadoPagoPayment: React.FC<MercadoPagoPaymentProps> = ({
  amount,
  customerInfo,
  eventInfo,
  ticketQuantity,
  ticketType = 'inteira',
  breakdown,
  onSuccess,
  onError,
  onCancel
}) => {
  const [preferenceId, setPreferenceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

  const createPreference = async () => {
    setIsLoading(true);
    try {
      // Step 1: Create transaction record first
      const transactionResponse = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo,
          eventInfo,
          ticketQuantity,
          ticketType,
          ticketInteiraQty: breakdown?.inteira ?? (ticketType === 'inteira' ? ticketQuantity : 0),
          ticketMeiaQty: breakdown?.meia ?? (ticketType === 'meia' ? ticketQuantity : 0),
          totalAmount: amount,
        }),
      });

      const transactionData = await transactionResponse.json();

      if (!transactionData.success || !transactionData.transactionId) {
        onError('Erro ao criar registro da transação');
        return;
      }

      const txId = transactionData.transactionId;
      setTransactionId(txId);
      console.log('✅ Transaction created:', txId);

      // Step 2: Create MercadoPago preference with transaction ID
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customerInfo,
          eventInfo,
          ticketQuantity,
          ticketType,
          ticketInteiraQty: breakdown?.inteira ?? (ticketType === 'inteira' ? ticketQuantity : 0),
          ticketMeiaQty: breakdown?.meia ?? (ticketType === 'meia' ? ticketQuantity : 0),
          transactionId: txId,
        }),
      });

      const data = await response.json();

      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
        setShowWallet(true);

        // Update transaction with preference ID
        await fetch('/api/transactions/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: txId,
            preferenceId: data.preferenceId,
          }),
        });
      } else {
        onError('Erro ao criar preferência de pagamento');
      }
    } catch (error) {
      console.error('Error creating preference:', error);
      onError('Erro ao conectar com o servidor de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    onSuccess(paymentId);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    onError('Erro no pagamento. Tente novamente.');
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Finalizar Pagamento</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Evento: <span className="font-medium">{eventInfo.title}</span></p>
          <p className="text-sm text-gray-600">Data: <span className="font-medium">{eventInfo.date}</span></p>
          <p className="text-sm text-gray-600">Quantidade: <span className="font-medium">{ticketQuantity} ingresso(s)</span></p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            Total: R$ {amount.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {!showWallet ? (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-3">
              <img
                src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__large_plus@2x.png"
                alt="Mercado Pago"
                className="h-10 object-contain"
                onError={(e) => {
                  // Try alternative URL
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('logo__large_plus')) {
                    target.src = 'https://http2.mlstatic.com/storage/logos-api-admin/51b446b0-571c-11e8-9a2d-4b2bd7b1bf77-xl@2x.png';
                  } else {
                    // Final fallback to styled text
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }
                }}
              />
              <div className="hidden">
                <svg className="h-10 w-auto" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="60" rx="8" fill="#009EE3" />
                  <text x="100" y="35" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">
                    MercadoPago
                  </text>
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-700 text-center">
              Pague com segurança usando Mercado Pago
            </p>
            <div className="flex justify-center mt-3 space-x-2">
              <span className="text-xs bg-white px-2 py-1 rounded">💳 Cartão</span>
              <span className="text-xs bg-white px-2 py-1 rounded">📱 PIX</span>
              <span className="text-xs bg-white px-2 py-1 rounded">🏦 Boleto</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={createPreference}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Carregando...
                </div>
              ) : (
                `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Complete o pagamento na janela do Mercado Pago
            </p>
          </div>

          {preferenceId && (
            <div className="mercadopago-wallet-container">
              <Wallet
                initialization={{
                  preferenceId: preferenceId
                }}
                onReady={() => {
                  console.log('MercadoPago Wallet ready');
                }}
                onError={(error: any) => {
                  console.error('MercadoPago Wallet error:', error);
                  handlePaymentError(error);
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default MercadoPagoPayment;
