import React, { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': { color: '#999' },
      padding: '12px'
    },
    invalid: {
      color: '#ef4444'
    }
  }
};

export const StripeCardInput: React.FC<{
  onGooglePayClick?: () => void;
  googlePayAvailable?: boolean;
  amount?: number;
  currency?: string;
}> = ({ onGooglePayClick, googlePayAvailable, amount, currency = 'MXN' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [prReady, setPrReady] = useState(false);

  useEffect(() => {
    if (!stripe || !window.PaymentRequest) return;

    const pr = stripe.paymentRequest({
      country: 'MX',
      currency: currency.toLowerCase(),
      total: {
        label: 'ServiciosHogar Reynosa',
        amount: amount ? Math.round(amount * 100) : 1000, // en centavos
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Google Pay / Apple Pay support
    pr.canMakePayment().then((result) => {
      if (result) {
        setPrReady(true);
      }
    });

    pr.on('paymentmethod', async (ev: any) => {
      // Confirmar PaymentIntent con el payment_method de Google Pay
      if (onGooglePayClick) {
        onGooglePayClick(ev.paymentMethod.id);
      }
      // Completa la payment request
      ev.complete('success');
    });

    setPaymentRequest(pr);

    // Cleanup
    return () => {
      pr.abort();
    };
  }, [stripe, amount, currency, onGooglePayClick]);

  // Montar botón Google Pay cuando esté listo
  useEffect(() => {
    if (prReady && paymentRequest) {
      const prButton = paymentRequest.createButton({ theme: 'dark' });
      const container = document.getElementById('google-pay-button');
      if (container && !container.hasChildNodes()) {
        container.appendChild(prButton);
      }
    }
  }, [prReady, paymentRequest]);

  return (
    <div className="space-y-3">
      {/* Google Pay Button */}
      {googlePayAvailable && prReady && (
        <div id="google-pay-button" className="w-full" />
      )}

      {googlePayAvailable && prReady && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-text-muted">o paga con tarjeta</span>
          </div>
        </div>
      )}

      {/* Card Element */}
      <div className="border border-border-subtle rounded-xl bg-white p-1">
        <CardElement options={CARD_STYLE} />
      </div>
    </div>
  );
};

export default StripeCardInput;