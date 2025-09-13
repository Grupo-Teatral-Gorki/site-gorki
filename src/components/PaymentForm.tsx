"use client";
import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';

interface PaymentFormProps {
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  eventInfo: {
    title: string;
    date: string;
    location: string;
  };
  ticketQuantity: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const PaymentFormContent = ({ 
  amount, 
  customerInfo, 
  eventInfo, 
  ticketQuantity, 
  onPaymentSuccess, 
  onPaymentError,
  onCancel 
}: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [processing, setProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [, setPaymentIntentId] = useState<string | null>(null);

  const createPaymentIntent = async (method: 'card' | 'pix') => {
    try {
      console.log('Creating payment intent for method:', method);
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethod: method,
          customerInfo,
          eventInfo,
          ticketQuantity,
        }),
      });

      const data = await response.json();
      console.log('Payment intent response:', data);
      
      if (!response.ok) {
        console.error('Payment intent error:', data);
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      console.error('Stripe not loaded');
      onPaymentError('Sistema de pagamento não carregado. Tente novamente.');
      return;
    }

    setProcessing(true);

    try {
      console.log('Creating payment intent...');
      const { clientSecret, paymentIntentId } = await createPaymentIntent('card');
      console.log('Payment intent created:', paymentIntentId);
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        console.error('Card element not found');
        onPaymentError('Elemento do cartão não encontrado');
        return;
      }

      console.log('Confirming card payment...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        onPaymentError(error.message || 'Erro no pagamento');
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onPaymentSuccess(paymentIntent.id);
      } else {
        console.log('Payment status:', paymentIntent?.status);
        onPaymentError('Pagamento não foi concluído');
      }
    } catch (error) {
      console.error('Card payment error:', error);
      onPaymentError('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handlePixPayment = async () => {
    setProcessing(true);

    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent('pix');
      setPaymentIntentId(paymentIntentId);

      if (!stripe) return;

      const { error, paymentIntent } = await stripe.confirmPixPayment(clientSecret);

      if (error) {
        onPaymentError(error.message || 'Erro no pagamento PIX');
      } else if (paymentIntent?.next_action && 'pix_display_qr_code' in paymentIntent.next_action) {
        const pixAction = paymentIntent.next_action as { pix_display_qr_code: { data: string } };
        setPixQrCode(pixAction.pix_display_qr_code.data);
        // Poll for payment status
        pollPaymentStatus(paymentIntentId);
      }
    } catch (_error) {
      onPaymentError('Erro ao processar pagamento PIX');
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (intentId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/payment-status/${intentId}`);
        const data = await response.json();

        if (data.status === 'succeeded') {
          onPaymentSuccess(intentId);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          onPaymentError('Timeout: Pagamento PIX não confirmado');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    poll();
  };

  if (pixQrCode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento PIX</h3>
          <p className="text-gray-600 mb-4">
            Escaneie o QR Code abaixo com seu app do banco para pagar
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 text-center">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <img 
              src={`data:image/png;base64,${pixQrCode}`} 
              alt="QR Code PIX" 
              className="mx-auto w-48 h-48"
            />
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Valor:</strong> R$ {amount.toFixed(2)}</p>
            <p><strong>Evento:</strong> {eventInfo.title}</p>
            <p><strong>Ingressos:</strong> {ticketQuantity}</p>
          </div>
        </div>

        <div className="text-center">
          <div className="animate-pulse text-yellow-600 mb-4">
            ⏳ Aguardando confirmação do pagamento...
          </div>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Finalizar Pagamento</h3>
        <p className="text-gray-600">
          Total: <span className="font-bold text-yellow-600">R$ {amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Forma de Pagamento
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 border-2 rounded-lg text-center transition-all ${
              paymentMethod === 'card'
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            💳 Cartão de Crédito
          </button>
          {/* PIX temporarily disabled until Stripe account is configured for PIX */}
          {/* <button
            type="button"
            onClick={() => setPaymentMethod('pix')}
            className={`p-3 border-2 rounded-lg text-center transition-all ${
              paymentMethod === 'pix'
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            🏦 PIX
          </button> */}
        </div>
      </div>

      {paymentMethod === 'card' && (
        <form onSubmit={handleCardPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dados do Cartão
            </label>
            <div className="p-3 border border-gray-300 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {processing ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
          </button>
        </form>
      )}

      {paymentMethod === 'pix' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Pagamento PIX</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Você receberá um QR Code para escanear com seu app do banco.
                  O pagamento é confirmado instantaneamente.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePixPayment}
            disabled={processing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {processing ? 'Gerando PIX...' : `Pagar R$ ${amount.toFixed(2)} via PIX`}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const PaymentForm = (props: PaymentFormProps) => {
  if (!stripePromise) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-600 mb-2">⚠️ Configuração Necessária</h3>
          <p className="text-gray-600 mb-4">
            O sistema de pagamento não está configurado. Configure as chaves do Stripe para continuar.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-yellow-800 mb-2">Como configurar:</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Crie uma conta no Stripe (stripe.com)</li>
              <li>Obtenha suas chaves de API no Dashboard</li>
              <li>Adicione as chaves no arquivo .env.local</li>
              <li>Reinicie o servidor de desenvolvimento</li>
            </ol>
          </div>
        </div>
        <button
          onClick={props.onCancel}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;
