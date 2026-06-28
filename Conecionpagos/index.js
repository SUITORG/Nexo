/**
 * conecionpagos/index.js — Módulo Stripe para SuitOrg
 * 
 * Maneja PaymentIntents y Webhooks para pagos con tarjeta.
 * Cada empresa puede tener su propia cuenta Stripe (multi-tenant)
 * o usar una global configurada en .env
 */
const stripeCache = new Map();

function getStripeInstance(companyId) {
  const cached = stripeCache.get(companyId);
  if (cached) return cached;

  const Stripe = require('stripe');
  const secretKey = process.env[`STRIPE_SECRET_KEY_${companyId}`] || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error(`Stripe no configurado para ${companyId}. Agrega STRIPE_SECRET_KEY_${companyId} en .env`);

  const instance = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  stripeCache.set(companyId, instance);
  return instance;
}

function getPublishableKey(companyId) {
  return process.env[`STRIPE_PUB_KEY_${companyId}`] || process.env.STRIPE_PUB_KEY || '';
}

async function createPaymentIntent({ amount, currency = 'mxn', companyId, metadata = {} }) {
  const stripe = getStripeInstance(companyId);
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata: {
      company_id: companyId,
      ...metadata
    },
    automatic_payment_methods: { enabled: true }
  });
  return {
    clientSecret: intent.client_secret,
    id: intent.id,
    amount: intent.amount
  };
}

async function confirmPayment(intentId, companyId) {
  const stripe = getStripeInstance(companyId);
  const intent = await stripe.paymentIntents.retrieve(intentId);
  return {
    status: intent.status,
    id: intent.id,
    amount: intent.amount / 100,
    metadata: intent.metadata
  };
}

async function handleWebhook(rawBody, signature, endpointSecret) {
  const Stripe = require('stripe');
  const event = Stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    return {
      event: 'payment_intent.succeeded',
      paymentIntentId: intent.id,
      companyId: intent.metadata.company_id,
      amount: intent.amount / 100,
      status: 'completed'
    };
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    return {
      event: 'payment_intent.payment_failed',
      paymentIntentId: intent.id,
      companyId: intent.metadata.company_id,
      amount: intent.amount / 100,
      status: 'failed'
    };
  }

  return { event: event.type, status: 'unhandled' };
}

module.exports = { createPaymentIntent, confirmPayment, handleWebhook, getPublishableKey };
