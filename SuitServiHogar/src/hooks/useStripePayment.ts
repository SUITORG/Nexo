import { useState } from 'react';
import { stripePromise } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { EscrowOrder } from '../types';

interface PaymentResult {
  success: boolean;
  error?: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  couponDiscount: number;
  commissionPct: number;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  };
}

export function useStripePayment() {
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const createPaymentIntent = async (order: EscrowOrder, stripeAccountId?: string, couponCode?: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amountMxn: order.totalMxn,
          orderId: order.id,
          technicianName: order.technician.name,
          serviceTitle: order.serviceTitle,
          stripeAccountId,
          couponCode: couponCode || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errData.error || 'Error al crear PaymentIntent');
      }

      const data: PaymentIntentResponse = await res.json();
      setClientSecret(data.clientSecret);
      return { clientSecret: data.clientSecret, couponDiscount: data.couponDiscount, commissionPct: data.commissionPct };
    } catch (err: any) {
      console.error('Error creating PaymentIntent:', err);
      throw err;
    }
  };

  const confirmPayment = async (cardElement: any, secretOverride?: string, paymentMethodId?: string): Promise<PaymentResult> => {
    setProcessing(true);
    try {
      const secret = secretOverride || clientSecret;
      if (!secret) throw new Error('PaymentIntent no creado');
      if (!cardElement && !paymentMethodId) throw new Error('Ingresa los datos de tu tarjeta');

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe no disponible');

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: paymentMethodId
          ? paymentMethodId
          : {
              card: cardElement,
              billing_details: { name: 'Cliente ServiHogar' }
            }
      });

      if (error) throw new Error(error.message);

      if (paymentIntent?.status === 'succeeded') {
        return { success: true };
      }

      throw new Error('Pago no completado');
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  };

  return { createPaymentIntent, confirmPayment, processing, clientSecret };
}
