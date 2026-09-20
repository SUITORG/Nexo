import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { generateCFDIXML, escapeXML, generateUUID } from './server/cfdiGenerator.js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Config from sh_config (cached 5 min) ───
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

const DEFAULT_CONFIG = {
  platform_fee_pct: 15,
  volume_discount_pct: 10,
  volume_min_orders: 20,
  volume_min_rating: 4.7,
  coupon_max_discount_pct: 50,
  referral_tech_reward_mxn: 15000,
  referral_client_reward_mxn: 10000,
  charity_fee_pct: 1,
};

async function loadConfig() {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }
  try {
    const { data } = await supabase
      .from('sh_config')
      .select('key, value')
      .in('category', ['platform', 'referrals', 'decisions']);
    if (data) {
      const mapped = { ...DEFAULT_CONFIG };
      for (const row of data) {
        if (row.key === 'platform_commission' && typeof row.value === 'object') {
          if (row.value.standard_pct != null) mapped.platform_fee_pct = row.value.standard_pct;
          if (row.value.volume_discount_pct != null) mapped.volume_discount_pct = row.value.volume_discount_pct;
          if (row.value.volume_min_orders != null) mapped.volume_min_orders = row.value.volume_min_orders;
          if (row.value.volume_min_rating != null) mapped.volume_min_rating = row.value.volume_min_rating;
          if (row.value.max_coupon_discount_pct != null) mapped.coupon_max_discount_pct = row.value.max_coupon_discount_pct;
        } else if (row.key === 'referral_rewards' && typeof row.value === 'object') {
          if (row.value.technician_reward_mxn != null) mapped.referral_tech_reward_mxn = row.value.technician_reward_mxn;
          if (row.value.client_reward_mxn != null) mapped.referral_client_reward_mxn = row.value.client_reward_mxn;
        } else if (row.key === 'charity_fee_pct') {
          mapped.charity_fee_pct = typeof row.value === 'number' ? row.value : parseInt(row.value, 10) || 1;
        }
      }
      configCache = mapped;
      configCacheTime = now;
      return mapped;
    }
  } catch (err) {
    console.error('Config load error, using defaults:', err.message);
  }
  return DEFAULT_CONFIG;
}

// ─── Security Middleware ───
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use(cors({
  origin: IS_DEV ? 'http://localhost:3000' : process.env.APP_URL || 'http://localhost:3000',
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ─── Auth Middleware (Supabase JWT) ───
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Auth failed' });
  }
}

// ─── Create Connect Account (onboard technician) ───
app.post('/api/create-connect-account', requireAuth, async (req, res) => {
  try {
    const { email, technicianId } = req.body;
    if (!email || !technicianId) {
      return res.status(400).json({ error: 'email and technicianId required' });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { technicianId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      settings: {
        payouts: {
          schedule: { interval: 'weekly' }
        }
      }
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin || 'http://localhost:3000'}/#perfil`,
      return_url: `${req.headers.origin || 'http://localhost:3000'}/#perfil`,
      type: 'account_onboarding'
    });

    res.json({ accountId: account.id, url: accountLink.url });
  } catch (err) {
    console.error('Connect account error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Create PaymentIntent (with Connect split) ───
app.post('/api/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { amountMxn, orderId, technicianName, serviceTitle, stripeAccountId, couponCode } = req.body;

    if (!amountMxn || amountMxn < 10) {
      return res.status(400).json({ error: 'Monto mínimo $10 MXN' });
    }

    let finalAmountMxn = amountMxn;
    let couponDiscount = 0;

    const cfg = await loadConfig();

    if (couponCode) {
      const { data: coupon, error: couponErr } = await supabase
        .from('sh_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (!couponErr && coupon) {
        const now = new Date();
        const expired = coupon.expires_at && new Date(coupon.expires_at) < now;
        const exhausted = coupon.current_uses >= coupon.max_uses;
        if (!expired && !exhausted) {
          couponDiscount = Math.min(coupon.discount_mxn, finalAmountMxn * (cfg.coupon_max_discount_pct / 100));
          finalAmountMxn = Math.max(finalAmountMxn - couponDiscount, 10);
          await supabase
            .from('sh_coupons')
            .update({ status: 'used', used_at: now.toISOString(), current_uses: coupon.current_uses + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    let feePct = cfg.platform_fee_pct;

    if (stripeAccountId) {
      const { count } = await supabase
        .from('sh_orders')
        .select('*', { count: 'exact', head: true })
        .eq('technician_id', req.user.id)
        .eq('status', 'released')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const { data: tech } = await supabase
        .from('sh_technicians')
        .select('rating')
        .eq('id', req.user.id)
        .maybeSingle();

      if (count >= cfg.volume_min_orders && tech?.rating >= cfg.volume_min_rating) {
        feePct = cfg.volume_discount_pct;
      }
    }

    const amountInCents = Math.round(finalAmountMxn * 100);
    const platformFee = Math.round(amountInCents * (feePct / 100));

    const intentParams = {
      amount: amountInCents,
      currency: 'mxn',
      metadata: {
        orderId: orderId || 'pending',
        technicianName: technicianName || '',
        serviceTitle: serviceTitle || '',
        couponCode: couponCode || '',
        couponDiscount: couponDiscount.toString(),
        commissionPct: feePct.toString()
      },
      automatic_payment_methods: { enabled: true }
    };

    if (stripeAccountId) {
      intentParams.transfer_data = { destination: stripeAccountId };
      intentParams.application_fee_amount = platformFee;
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams);
    res.json({ clientSecret: paymentIntent.client_secret, couponDiscount, commissionPct: feePct });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Validate Coupon ───
app.post('/api/validate-coupon', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código requerido' });

    const { data: coupon, error } = await supabase
      .from('sh_coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('status', 'active')
      .maybeSingle();

    if (error || !coupon) {
      return res.json({ valid: false, discountMxn: 0, message: 'Cupón no encontrado' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.json({ valid: false, discountMxn: 0, message: 'Cupón expirado' });
    }

    if (coupon.current_uses >= coupon.max_uses) {
      return res.json({ valid: false, discountMxn: 0, message: 'Cupón ya utilizado' });
    }

    res.json({ valid: true, discountMxn: coupon.discount_mxn, message: `-$${coupon.discount_mxn} MXN de descuento` });
  } catch (err) {
    console.error('Coupon validation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Stripe Webhook (NO auth — Stripe calls this) ───
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️  STRIPE_WEBHOOK_SECRET not set — rejecting webhook');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    console.log(`✅ Payment succeeded: ${pi.id} — $${(pi.amount / 100).toFixed(2)} MXN`);

    if (orderId && orderId !== 'pending') {
      const { error } = await supabase
        .from('sh_orders')
        .update({ status: 'funded', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) console.error('DB update error:', error.message);
    }
  }

  res.json({ received: true });
});

// ─── Dev Mode Endpoints (only in development) ───
if (IS_DEV) {
  // Mock PaymentIntent - always succeeds
  app.post('/api/create-payment-intent', async (req, res) => {
    const { amountMxn, orderId, couponCode } = req.body;
    if (!amountMxn || amountMxn < 10) {
      return res.status(400).json({ error: 'Monto mínimo $10 MXN' });
    }
    const cfg = await loadConfig();
    let finalAmountMxn = amountMxn;
    let couponDiscount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('sh_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();
      if (coupon && coupon.current_uses < coupon.max_uses) {
        couponDiscount = Math.min(coupon.discount_mxn, finalAmountMxn * (cfg.coupon_max_discount_pct / 100));
        finalAmountMxn = Math.max(finalAmountMxn - couponDiscount, 10);
      }
    }
    res.json({ 
      clientSecret: 'pi_dev_mock_secret_' + Date.now(), 
      couponDiscount, 
      commissionPct: cfg.platform_fee_pct 
    });
  });

  // Mock webhook confirmation
  app.post('/api/dev/confirm-payment', async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId requerido' });
    const { error } = await supabase
      .from('sh_orders')
      .update({ status: 'funded', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, orderId });
  });

  // Seed test data
  app.post('/api/dev/seed', async (req, res) => {
    try {
      // 1. Create mock technicians
      const techs = [
        { id: 'tech-dev-1', name: 'Roberto Pérez', email: 'roberto@servihogar.mx', stripe_account_id: 'acct_dev_mock_1', active: true },
        { id: 'tech-dev-2', name: 'Carlos López', email: 'carlos@servihogar.mx', stripe_account_id: 'acct_dev_mock_2', active: true },
        { id: 'tech-dev-3', name: 'Héctor García', email: 'hector@servihogar.mx', stripe_account_id: 'acct_dev_mock_3', active: true },
        { id: 'tech-dev-4', name: 'Juan Martínez', email: 'juan@servihogar.mx', stripe_account_id: 'acct_dev_mock_4', active: true },
        { id: 'tech-dev-5', name: 'María González', email: 'maria@servihogar.mx', stripe_account_id: 'acct_dev_mock_5', active: true },
      ];

      for (const tech of techs) {
        await supabase.from('sh_technicians').upsert({
          id: tech.id,
          name: tech.name,
          email: tech.email,
          stripe_account_id: tech.stripe_account_id,
          active: tech.active,
          avatar: `https://i.pravatar.cc/150?u=${tech.id}`,
          title: 'Especialista Certificado',
          rating: 4.5 + Math.random() * 0.5,
          review_count: Math.floor(Math.random() * 50) + 20,
          distance: '1.2 km',
          colonia: 'Las Fuentes',
          verified_badges: ['INE + Biometría'],
          tags: ['Servicio general'],
          price_mxn: 650,
          price_usd: 36.11,
          price_description: 'Incluye diagnóstico',
          availability_badge: 'Disponible',
          years_experience: 10,
          level: 3,
          bio: 'Especialista certificado con experiencia.',
          certifications: ['Certificación CONOCER'],
          category_ids: ['plomeria'],
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      // 2. Create mock orders
      const orders = [
        { id: 'ORD-DEV-001', technician_id: 'tech-dev-1', client_id: 'client-dev-1', service_title: 'Reparación fuga cocina', service_description: 'Fuga en llave de cocina', base_price_mxn: 85000, base_price_usd: 4722, total_mxn: 85000, total_usd: 4722, status: 'funded', exchange_rate: 18.0, evidence_photos: [], zone_name: 'Las Fuentes', charity_fee_mxn: 850, created_at: new Date().toISOString() },
        { id: 'ORD-DEV-002', technician_id: 'tech-dev-2', client_id: 'client-dev-1', service_title: 'Instalación minisplit', service_description: 'Minisplit 1.5 ton', base_price_mxn: 120000, base_price_usd: 6666, total_mxn: 120000, total_usd: 6666, status: 'in_progress', exchange_rate: 18.0, evidence_photos: [], zone_name: 'Jarachina', charity_fee_mxn: 1200, created_at: new Date().toISOString() },
        { id: 'ORD-DEV-003', technician_id: 'tech-dev-3', client_id: 'client-dev-1', service_title: 'Pintura interior 3 recámaras', service_description: 'Pintura completa', base_price_mxn: 95000, base_price_usd: 5277, total_mxn: 95000, total_usd: 5277, status: 'completed', exchange_rate: 18.0, evidence_photos: [], zone_name: 'Del Prado', charity_fee_mxn: 950, created_at: new Date().toISOString() },
      ];

      for (const order of orders) {
        await supabase.from('sh_orders').upsert(order, { onConflict: 'id' });
      }

      // 3. Referrals
      await supabase.from('sh_referrals').upsert([
        { code: 'REF-TECH-TEST123', referrer_type: 'technician', referrer_id: 'tech-dev-1', referee_id: 'tech-dev-4', reward_mxn: 15000, status: 'completed', created_at: new Date().toISOString() },
        { code: 'REF-CLIENT-TEST456', referrer_type: 'client', referrer_id: 'client-dev-1', referee_id: 'client-dev-2', reward_mxn: 10000, status: 'completed', created_at: new Date().toISOString() },
        { code: 'REF-TECH-EXPIRED', referrer_type: 'technician', referrer_id: 'tech-dev-5', referee_id: 'tech-dev-1', reward_mxn: 15000, status: 'expired', created_at: new Date().toISOString() },
      ], { onConflict: 'code' });

      // 4. Coupons
      await supabase.from('sh_coupons').upsert([
        { code: 'REF-TECH-TEST123', discount_mxn: 15000, max_discount_mxn: 50000, current_uses: 0, max_uses: 1, status: 'active', created_at: new Date().toISOString() },
        { code: 'REF-CLIENT-TEST456', discount_mxn: 10000, max_discount_mxn: 50000, current_uses: 0, max_uses: 1, status: 'active', created_at: new Date().toISOString() },
        { code: 'REF-TECH-EXPIRED', discount_mxn: 15000, max_discount_mxn: 50000, current_uses: 1, max_uses: 1, status: 'used', expires_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date().toISOString() },
      ], { onConflict: 'code' });

      // 5. Reviews
      await supabase.from('sh_reviews').upsert([
        { order_id: 'ORD-DEV-001', reviewer_id: 'client-dev-1', reviewee_id: 'tech-dev-1', reviewer_role: 'client', rating: 5, comment: 'Excelente servicio, muy profesional', status: 'published', created_at: new Date().toISOString() },
        { order_id: 'ORD-DEV-002', reviewer_id: 'tech-dev-2', reviewee_id: 'client-dev-1', reviewer_role: 'technician', rating: 4, comment: 'Buen cliente, pagó a tiempo', status: 'published', created_at: new Date().toISOString() },
      ], { onConflict: 'order_id,reviewer_id' });

      // 6. Messages
      await supabase.from('sh_messages').upsert([
        { order_id: 'ORD-DEV-001', sender_id: 'client-dev-1', sender_role: 'client', content: 'Hola, ¿cuándo llegas?', message_type: 'text', created_at: new Date().toISOString() },
        { order_id: 'ORD-DEV-001', sender_id: 'tech-dev-1', sender_role: 'technician', content: 'Llego en 15 min', message_type: 'text', created_at: new Date().toISOString() },
      ], { onConflict: 'id' });

      res.json({ success: true, message: 'Seed data created: 5 techs, 3 orders, referrals, coupons, reviews, messages' });
    } catch (err) {
      console.error('Seed error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mock confirm payment for dev frontend
  app.post('/api/dev/confirm-payment', async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId requerido' });
    const { error } = await supabase
      .from('sh_orders')
      .update({ status: 'funded', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, orderId });
  });

  // Dev status endpoint
  app.get('/api/dev/status', (req, res) => {
    res.json({ 
      devMode: true, 
      mockStripe: true, 
      mockExchangeRate: true,
      timestamp: new Date().toISOString()
    });
  });

  // ─── Configuration API (for backoffice) ───
  // Get all configurations
  app.get('/api/config', requireAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sh_config')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      res.json({ success: true, configs: data });
    } catch (err) {
      console.error('Get configs error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Get config by key
  app.get('/api/config/:key', requireAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sh_config')
        .select('*')
        .eq('key', req.params.key)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Config no encontrada' });
      res.json({ success: true, config: data });
    } catch (err) {
      console.error('Get config error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Update config (admin only)
  app.put('/api/config/:key', requireAuth, async (req, res) => {
    try {
      const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.slice(7));
      const { value, description } = req.body;
      
      if (!value) return res.status(400).json({ error: 'Valor requerido' });
      
      const { data: tech } = await supabase
        .from('sh_technicians')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!tech || tech.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden modificar configuración' });
      }
      
      const { data, error } = await supabase
        .from('sh_config')
        .update({ 
          value, 
          description: description || '',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', req.params.key)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, config: data });
    } catch (err) {
      console.error('Update config error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Get config by category (for frontend)
  app.get('/api/config/category/:category', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sh_config')
        .select('key, value')
        .eq('category', req.params.category);
      
      if (error) throw error;
      res.json({ success: true, configs: data });
    } catch (err) {
      console.error('Get config by category error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── CFDI 4.0 Generation (CFDI 4.0 + Complemento Traslado) ───
  app.post('/api/cfdi/generate', requireAuth, async (req, res) => {
    try {
      const { orderId, receptorType } = req.body; // receptorType: 'client' | 'technician'
      
      if (!orderId) {
        return res.status(400).json({ error: 'orderId requerido' });
      }

      // Obtener orden
      const { data: order, error: orderErr } = await supabase
        .from('sh_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Obtener técnico
      const { data: tech } = await supabase
        .from('sh_technicians')
        .select('*')
        .eq('id', order.technician_id)
        .single();

      // Obtener cliente (usuario actual)
      const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.slice(7));

      // Determinar receptor según quién pide la factura
      const isClient = receptorType === 'client' || (user?.email && user.email === order.client_id);
      const receptor = isClient ? 'client' : 'technician';

      // Datos para CFDI
      const cfdiData = {
        serie: 'A',
        folio: Math.floor(Math.random() * 1000000),
        fecha: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
        formaPago: '28', // Tarjeta de crédito
        metodoPago: 'PUE',
        moneda: 'MXN',
        tipoComprobante: 'I',
        exportacion: '01',
        subTotal: order.total_mxn / 1.16, // sin IVA
        descuento: 0,
        total: order.total_mxn / 100, // convertir a pesos
        totalImpuestosTrasladados: (order.total_mxn / 100) * 0.16,
        tipoComprobante: 'I',
        exportacion: '01',
        formaPago: '28',
        metodoPago: 'PUE',
        moneda: 'MXN',
        tipoComprobante: 'I',
        exportacion: '01',
        total: order.total_mxn / 100,
        
        emisor: {
          rfc: 'SHO260915AB1',
          nombre: 'ServiciosHogar Reynosa SA de CV',
          regimenFiscal: '601',
          codigoPostal: '88720',
        },
        
        receptor: {
          rfc: receptor === 'client' ? 'XAXX010101000' : (tech?.rfc || 'XAXX010101000'), // Público en general si no hay RFC
          nombre: receptor === 'client' ? 'Cliente Público en General' : (tech?.name || 'Técnico'),
          regimenFiscalReceptor: '612', // Personas físicas con actividades empresariales
          codigoPostal: '88720',
          usoCFDI: 'G01', // Gastos en general
        },
        
        conceptos: [{
          claveProdServ: '81111500',
          claveUnidad: 'ACT',
          descripcion: order.service_title || 'Servicio técnico',
          cantidad: 1,
          valorUnitario: (order.total_mxn / 100) / 1.16,
          importe: (order.total_mxn / 100) / 1.16,
          objetoImp: '02', // Exento (servicios profesionales)
          impuestos: {
            traslados: [{
              base: (order.total_mxn / 100) / 1.16,
              impuesto: '002',
              tipoFactor: 'Tasa',
              tasaOCuota: 0.16,
              importe: ((order.total_mxn / 100) / 1.16) * 0.16,
            }]
          }
        }],
        
        complementoTraslado: {
          version: '1.0',
          origen: {
            rfc: 'SHO260915AB1',
            nombre: 'ServiciosHogar Reynosa SA de CV',
            direccion: {
              calle: 'Av. Monterrey',
              noExterior: '100',
              colonia: 'Centro',
              municipio: 'Reynosa',
              estado: 'Tamaulipas',
              pais: 'México',
              codigoPostal: '88720',
            }
          },
          destino: {
            rfc: receptor === 'client' ? 'XAXX010101000' : (tech?.rfc || 'XAXX010101000'),
            nombre: receptor === 'client' ? 'Cliente Público en General' : (tech?.name || 'Técnico'),
            direccion: {
              calle: order.street || 'Av. Principal',
              noExterior: order.number || '100',
              colonia: order.zone_name || 'Centro',
              municipio: 'Reynosa',
              estado: 'Tamaulipas',
              pais: 'México',
              codigoPostal: '88720',
            }
          },
          distancia: 5,
          fechaHoraSalida: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
          fechaHoraLlegada: new Date(Date.now() + 3600000).toISOString().replace(/\.\d{3}Z$/, ''),
        }
      };

      // Generar CFDI usando generador server-side
      const { generateCFDIXML, generateUUID, escapeXML } = await import('./server/cfdiGenerator.js');
      
      const xmlSinFirmar = generateCFDIXML(cfdiData);
      const uuid = generateUUID();
      const fechaTimbrado = new Date().toISOString().replace(/\.\d{3}Z$/, '');
      const selloCFD = 'MOCK_SELLO_CFD_' + Buffer.from(uuid).toString('base64').substring(0, 40);
      const selloSAT = 'MOCK_SELLO_SAT_' + Buffer.from(uuid).toString('base64').substring(0, 40);
      
      // Insertar sello en XML
      const xmlFirmado = xmlSinFirmar.replace(
        'xsi:schemaLocation=',
        `Sello="MOCK_SELLO" NoCertificado="00001000000400002345" Certificado="MIIF..." xsi:schemaLocation=`
      ).replace(
        '</cfdi:Comprobante>',
        `<cfdi:Complemento><tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="${generateUUID()}" FechaTimbrado="${new Date().toISOString().replace(/\.\d{3}Z$/, '')}" SelloCFD="MOCK_SELLO" NoCertificadoSAT="00001000000400002345" SelloSAT="MOCK_SELLO" RfcProvCertif="PAC010101XXX" /></cfdi:Complemento></cfdi:Comprobante>`
      );
      
      const cfdi = {
        xml: xmlFirmado,
        uuid: generateUUID(),
        fechaTimbrado: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
        qrCode: `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${generateUUID()}&re=SHO260915AB1&rr=XAXX010101000&tt=${cfdiData.total.toFixed(2)}`
      };

      res.json({ 
        success: true, 
        cfdi: {
          xml: cfdi.xml,
          uuid: cfdi.uuid,
          fechaTimbrado: cfdi.fechaTimbrado,
          qrCode: cfdi.qrCode,
        }
      });
    } catch (err) {
      console.error('CFDI generation error:', err);
      res.status(500).json({ error: err.message });
    }
  });

const PORT = process.env.STRIPE_PORT || 3010;
app.listen(PORT, () => {
  console.log(`Stripe server running on port ${PORT}`);
});
