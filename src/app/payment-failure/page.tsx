'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailure() {
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Rejeitado
          </h1>
          <p className="text-gray-600">
            Houve um problema com seu pagamento. Verifique os dados e tente novamente.
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
              {paymentData.status && (
                <p><span className="font-medium">Status:</span> {paymentData.status}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={() => window.history.back()}
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
          <Link 
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
