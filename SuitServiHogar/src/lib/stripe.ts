import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing VITE_STRIPE_PUBLISHABLE_KEY');
}

export const stripePromise = loadStripe(stripePublishableKey);
