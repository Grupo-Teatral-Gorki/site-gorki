'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

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
  };
  details?: string;
}

function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (!isMounted) return;
    
    setIsScanning(true);
    setValidationResult(null);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      
      const element = document.getElementById('qr-reader');
      if (!element) {
        console.error('QR reader element not found');
        setIsScanning(false);
        return;
      }

      scannerRef.current = new Html5Qrcode('qr-reader');
      
      // Get camera devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        // Prefer back camera (environment facing) over front camera (user facing)
        let cameraId = devices[0].id;
        
        // Look for back camera
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          cameraId = backCamera.id;
        } else if (devices.length > 1) {
          // If no explicit back camera found, use the second camera (usually back on mobile)
          cameraId = devices[1].id;
        }
        
        console.log('Starting scanner with camera:', cameraId);
        
        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              facingMode: "environment"
            }
          },
          (decodedText: string) => {
            console.log('✅ QR Code successfully scanned:', decodedText);
            validateTicket(decodedText);
            stopScanner();
          },
          (error: any) => {
            // Only log actual errors, not scanning attempts
            if (error && !error.includes('NotFoundException')) {
              console.debug('QR scan error:', error);
            }
          }
        );
        
        console.log('Scanner started successfully');
      } else {
        throw new Error('No cameras found');
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      alert('Erro ao iniciar câmera. Verifique as permissões.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.log('Scanner already stopped');
      }
    }
    setIsScanning(false);
  };

  const validateTicket = async (qrData: string) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        valid: false,
        message: 'Erro ao validar ingresso',
        status: 'error',
        details: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualValidation = () => {
    if (manualInput.trim()) {
      validateTicket(manualInput.trim());
      setManualInput('');
    }
  };

  const resetScanner = () => {
    setValidationResult(null);
    setManualInput('');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
            Scanner de Ingressos
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Escaneie o QR Code do ingresso para validar a entrada
          </p>

          {!validationResult && (
            <div className="space-y-6">
              {/* Camera Scanner */}
              <div className="text-center">
                {!isScanning ? (
                  <button
                    onClick={startScanner}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    📱 Iniciar Scanner da Câmera
                  </button>
                ) : (
                  <div>
                    <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        📱 Aponte a câmera para o QR Code do ingresso
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Mantenha o código dentro da área de escaneamento
                      </p>
                      <button
                        onClick={stopScanner}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Parar Scanner
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 text-center">
                  Ou digite o código manualmente:
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Cole o código QR aqui..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualValidation()}
                  />
                  <button
                    onClick={handleManualValidation}
                    disabled={!manualInput.trim() || isValidating}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isValidating ? 'Validando...' : 'Validar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className="text-center">
              <div className={`p-6 rounded-lg mb-6 ${
                validationResult.valid 
                  ? 'bg-green-100 border border-green-300' 
                  : validationResult.status === 'used'
                  ? 'bg-yellow-100 border border-yellow-300'
                  : 'bg-red-100 border border-red-300'
              }`}>
                <div className={`text-6xl mb-4 ${
                  validationResult.valid 
                    ? 'text-green-600' 
                    : validationResult.status === 'used'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {validationResult.valid ? '✅' : validationResult.status === 'used' ? '⚠️' : '❌'}
                </div>
                
                <h2 className={`text-2xl font-bold mb-2 ${
                  validationResult.valid 
                    ? 'text-green-800' 
                    : validationResult.status === 'used'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {validationResult.message}
                </h2>

                {validationResult.details && (
                  <p className="text-gray-700 mb-4">{validationResult.details}</p>
                )}

                {validationResult.ticketInfo && (
                  <div className="bg-white p-4 rounded-lg text-left">
                    <h3 className="font-bold text-lg mb-2">Informações do Ingresso:</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Número:</strong> {validationResult.ticketInfo.ticketNumber}</p>
                      <p><strong>Evento:</strong> {validationResult.ticketInfo.eventTitle}</p>
                      <p><strong>Data:</strong> {validationResult.ticketInfo.eventDate}</p>
                      <p><strong>Local:</strong> {validationResult.ticketInfo.eventLocation}</p>
                      <p><strong>Portador:</strong> {validationResult.ticketInfo.customerName}</p>
                      <p><strong>Ingresso:</strong> {validationResult.ticketInfo.ticketIndex} de {validationResult.ticketInfo.totalTickets}</p>
                      {validationResult.ticketInfo.validatedAt && (
                        <p><strong>Validado em:</strong> {new Date(validationResult.ticketInfo.validatedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetScanner}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Escanear Próximo Ingresso
              </button>
            </div>
          )}

          {isValidating && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Validando ingresso...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">Como usar:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use a câmera para escanear o QR Code do ingresso</li>
            <li>• Ou cole/digite o código manualmente no campo de texto</li>
            <li>• ✅ Verde = Entrada autorizada</li>
            <li>• ⚠️ Amarelo = Ingresso já foi usado</li>
            <li>• ❌ Vermelho = Ingresso inválido</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export as dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(QRScanner), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Carregando scanner...</p>
      </div>
    </div>
  )
});
