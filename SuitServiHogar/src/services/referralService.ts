import { supabase } from '../lib/supabase';

const TECH_REWARD_MXN = 150;
const CLIENT_COUPON_MXN = 100;

// Generate a unique 8-char alphanumeric code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createReferralCode(
  referrerType: 'technician' | 'client',
  referrerId: string,
  rewardMxn: number
): Promise<string> {
  const code = generateCode();

  const { error } = await supabase
    .from('sh_referrals')
    .insert({
      code,
      referrer_type: referrerType,
      referrer_id: referrerId,
      reward_mxn: rewardMxn,
      status: 'pending'
    });

  if (error) {
    if (error.code === '23505') {
      return createReferralCode(referrerType, referrerId, rewardMxn);
    }
    throw error;
  }

  return code;
}

export async function getReferralCode(
  referrerType: 'technician' | 'client',
  referrerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('sh_referrals')
    .select('code')
    .eq('referrer_type', referrerType)
    .eq('referrer_id', referrerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.code ?? null;
}

export async function applyReferralCode(
  code: string,
  referredId: string
): Promise<{ referrerType: string; referrerId: string; rewardMxn: number }> {
  const { data: referral, error: fetchErr } = await supabase
    .from('sh_referrals')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('status', 'pending')
    .single();

  if (fetchErr || !referral) {
    throw new Error('Código de referido inválido o ya utilizado');
  }

  if (referral.referrer_id === referredId) {
    throw new Error('No puedes referirte a ti mismo');
  }

  const { error: updateErr } = await supabase
    .from('sh_referrals')
    .update({
      referred_id: referredId,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', referral.id);

  if (updateErr) throw updateErr;

  const couponCode = generateCode();

  const { error: couponErr } = await supabase
    .from('sh_coupons')
    .insert({
      code: couponCode,
      discount_mxn: CLIENT_COUPON_MXN,
      referrer_type: referral.referrer_type,
      referrer_id: referral.referrer_id,
      status: 'active',
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    });

  if (couponErr) throw couponErr;

  return {
    referrerType: referral.referrer_type,
    referrerId: referral.referrer_id,
    rewardMxn: referral.reward_mxn
  };
}

export async function completeReferralReward(
  orderId: string,
  technicianId: string,
  clientId: string
): Promise<void> {
  const { data: referrals, error } = await supabase
    .from('sh_referrals')
    .select('*')
    .eq('referred_id', clientId)
    .eq('status', 'completed')
    .limit(1);

  if (error || !referrals || referrals.length === 0) return;

  const referral = referrals[0];

  if (referral.referrer_type === 'technician' && referral.referrer_id !== technicianId) {
    const { error: updateErr } = await supabase
      .from('sh_referrals')
      .update({ reward_mxn: TECH_REWARD_MXN })
      .eq('id', referral.id);

    if (updateErr) throw updateErr;
  }
}

export async function getMyReferralStats(
  referrerType: 'technician' | 'client',
  referrerId: string
): Promise<{
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsMxn: number;
}> {
  const { data, error } = await supabase
    .from('sh_referrals')
    .select('status, reward_mxn')
    .eq('referrer_type', referrerType)
    .eq('referrer_id', referrerId);

  if (error) throw error;

  const rows = data ?? [];
  return {
    totalReferrals: rows.length,
    completedReferrals: rows.filter(r => r.status === 'completed').length,
    pendingReferrals: rows.filter(r => r.status === 'pending').length,
    totalRewardsMxn: rows
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.reward_mxn ?? 0), 0)
  };
}

export async function getCouponsForUser(userId: string): Promise<Array<{
  code: string;
  discountMxn: number;
  expiresAt: string | null;
}>> {
  const { data, error } = await supabase
    .from('sh_coupons')
    .select('code, discount_mxn, expires_at')
    .eq('used_by', userId)
    .eq('status', 'used');

  if (error) throw error;

  const { data: unused, error: err2 } = await supabase
    .from('sh_coupons')
    .select('code, discount_mxn, expires_at')
    .eq('referrer_id', userId)
    .eq('status', 'active');

  if (err2) throw err2;

  return [
    ...(data ?? []).map(c => ({ code: c.code, discountMxn: c.discount_mxn, expiresAt: c.expires_at })),
    ...(unused ?? []).map(c => ({ code: c.code, discountMxn: c.discount_mxn, expiresAt: c.expires_at }))
  ];
}

export async function validateCoupon(
  code: string
): Promise<{ valid: boolean; discountMxn: number; message: string }> {
  const { data: coupon, error } = await supabase
    .from('sh_coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('status', 'active')
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, discountMxn: 0, message: 'Cupón no encontrado' };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, discountMxn: 0, message: 'Cupón expirado' };
  }

  if (coupon.current_uses >= coupon.max_uses) {
    return { valid: false, discountMxn: 0, message: 'Cupón ya utilizado' };
  }

  return {
    valid: true,
    discountMxn: coupon.discount_mxn,
    message: `Cupón válido: -$${coupon.discount_mxn} MXN`
  };
}
