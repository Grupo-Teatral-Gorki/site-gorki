'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPending() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // Extract payment information from URL parameters
    const data = {
      paymentId: searchParams.get('payment_id'),
      status: searchParams.get('status'),
      externalReference: searchParams.get('external_reference'),
      merchantOrderId: searchParams.get('merchant_order_id'),
      preferenceId: searchParams.get('preference_id'),
      paymentType: searchParams.get('payment_type'),
    };
    setPaymentData(data);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Pendente
          </h1>
          <p className="text-gray-600">
            Seu pagamento está sendo processado. Você receberá uma confirmação assim que for aprovado.
          </p>
        </div>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Pagamento</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {paymentData.paymentId && (
                <p><span className="font-medium">ID do Pagamento:</span> {paymentData.paymentId}</p>
              )}
              {paymentData.externalReference && (
                <p><span className="font-medium">Referência:</span> {paymentData.externalReference}</p>
              )}
              {paymentData.paymentType && (
                <p><span className="font-medium">Método:</span> {paymentData.paymentType}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">O que acontece agora?</h3>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Aguarde a confirmação do pagamento</li>
            <li>• Você receberá um e-mail quando aprovado</li>
            <li>• Para PIX/Boleto, pode levar alguns minutos</li>
            <li>• Mantenha este número de referência</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </Link>
          <Link 
            href="/eventos"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ver Outros Eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
