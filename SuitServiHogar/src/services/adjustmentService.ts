import { supabase } from '../lib/supabase';

// Re-cotización / Ajuste in-situ (req #44) — cliente de los endpoints de server.js.
// Los montos van SIEMPRE en centavos (convención del proyecto).

export interface InSituAdjustment {
  id: string;
  order_id: string;
  status: string; // pending | accepted | rejected | expired
  phase: string;
  original_price_mxn: number;
  extra_amount_mxn: number | null;
  agreed_price_mxn: number | null;
  reason: string | null;
  created_at: string;
}

type RespondResult =
  | { status: 'accepted'; dev?: true }
  | { status: 'rejected' }
  | { clientSecret: string; paymentIntentId: string; amountMxn: number };

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export async function requestAdjustment(orderId: string, extraAmountMxn: number, reason: string): Promise<InSituAdjustment> {
  const res = await fetch(`/api/bookings/${orderId}/request-adjustment`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ extra_amount_mxn: extraAmountMxn, reason }),
  });
  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error || 'No se pudo enviar la re-cotización');
  return data.negotiation;
}

export async function respondAdjustment(
  orderId: string,
  action: 'ACCEPT' | 'REJECT',
  opts?: { mock?: boolean; paymentIntentId?: string }
): Promise<RespondResult> {
  const res = await fetch(`/api/bookings/${orderId}/respond-adjustment`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action, mock: opts?.mock, paymentIntentId: opts?.paymentIntentId }),
  });
  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error || 'No se pudo procesar la respuesta');
  return data;
}

// Último ajuste in-situ por orden (RLS limita a órdenes donde soy participante)
export async function fetchInSituAdjustments(orderIds: string[]): Promise<Record<string, InSituAdjustment>> {
  if (orderIds.length === 0) return {};
  const { data, error } = await supabase
    .from('sh_price_negotiations')
    .select('id, order_id, status, phase, original_price_mxn, extra_amount_mxn, agreed_price_mxn, reason, created_at')
    .in('order_id', orderIds)
    .eq('phase', 'IN_SITU')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const latest: Record<string, InSituAdjustment> = {};
  for (const row of data || []) {
    if (!latest[row.order_id]) latest[row.order_id] = row as InSituAdjustment;
  }
  return latest;
}
