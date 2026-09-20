import { supabase } from '../lib/supabase';
import { EscrowOrder, Technician } from '../types';
import { getRate } from '../services/exchangeRate';

interface SupabaseOrder {
  id: string;
  service_title: string;
  service_description: string;
  technician_id: string;
  date: string;
  time_window: string;
  base_price_mxn: number;
  base_price_usd: number;
  guarantee_price_mxn: number;
  sat_retention_mxn: number;
  total_mxn: number;
  total_usd: number;
  exchange_rate: number;
  status: 'draft' | 'funded' | 'in_progress' | 'completed' | 'released';
  evidence_photos: string[];
  zone_name: string;
  client_id: string;
  street?: string;
  number?: string;
  gps_lat?: number;
  gps_lng?: number;
}

function mapOrder(row: SupabaseOrder, technician: Technician): EscrowOrder {
  return {
    id: row.id,
    serviceTitle: row.service_title,
    serviceDescription: row.service_description,
    technician,
    clientId: row.client_id,
    date: row.date,
    timeWindow: row.time_window,
    basePriceMxn: row.base_price_mxn,
    basePriceUsd: row.base_price_usd,
    guaranteePriceMxn: row.guarantee_price_mxn,
    satRetentionMxn: row.sat_retention_mxn,
    totalMxn: row.total_mxn,
    totalUsd: row.total_usd,
    exchangeRate: row.exchange_rate,
    status: row.status,
    evidencePhotos: row.evidence_photos,
    zoneName: row.zone_name,
    street: row.street,
    number: row.number,
    gpsLat: row.gps_lat,
    gpsLng: row.gps_lng,
  };
}

export async function createOrder(
  technicianId: string,
  serviceTitle: string,
  serviceDescription: string,
  clientId: string,
  zoneName: string,
  address?: { street?: string; number?: string; gpsLat?: number; gpsLng?: number }
): Promise<EscrowOrder> {
  const { data: tech, error: techErr } = await supabase
    .from('sh_technicians')
    .select('*')
    .eq('id', technicianId)
    .single();

  if (techErr) throw techErr;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orderData = {
    service_title: serviceTitle,
    service_description: serviceDescription,
    technician_id: technicianId,
    date: tomorrow.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }),
    time_window: '09:00 - 11:30 AM',
    base_price_mxn: tech.price_mxn,
    base_price_usd: tech.price_usd,
    guarantee_price_mxn: 0,
    sat_retention_mxn: 0,
    total_mxn: tech.price_mxn,
    total_usd: tech.price_usd,
    exchange_rate: await getRate(),
    status: 'draft',
    evidence_photos: [],
    zone_name: zoneName,
    client_id: clientId,
    street: address?.street,
    number: address?.number,
    gps_lat: address?.gpsLat,
    gps_lng: address?.gpsLng,
  };

  const { data, error } = await supabase
    .from('sh_orders')
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;
  return mapOrder(data as SupabaseOrder, tech as Technician);
}

export async function fetchOrdersByClient(clientId: string): Promise<EscrowOrder[]> {
  const { data: orders, error } = await supabase
    .from('sh_orders')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const results: EscrowOrder[] = [];
  for (const order of orders as SupabaseOrder[]) {
    const { data: tech } = await supabase
      .from('sh_technicians')
      .select('*')
      .eq('id', order.technician_id)
      .single();

    if (tech) {
      results.push(mapOrder(order, tech as Technician));
    }
  }

  return results;
}

export async function updateOrderStatus(
  orderId: string,
  status: 'draft' | 'funded' | 'in_progress' | 'completed' | 'released'
): Promise<void> {
  const { error } = await supabase
    .from('sh_orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;

  if (status === 'released') {
    const { data: order } = await supabase
      .from('sh_orders')
      .select('technician_id, client_id')
      .eq('id', orderId)
      .single();

    if (order) {
      const { data: referral } = await supabase
        .from('sh_referrals')
        .select('id, referrer_id')
        .eq('referred_id', order.technician_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (referral) {
        await supabase
          .from('sh_referrals')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', referral.id);

        await supabase.from('sh_coupons').insert({
          code: `REF-${referral.referrer_id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          discount_mxn: 150,
          max_uses: 1,
          current_uses: 0,
          status: 'active',
          created_by: referral.referrer_id,
          target_user_id: referral.referrer_id,
          description: 'Bono por referido de técnico'
        });
      }

      const { data: clientReferral } = await supabase
        .from('sh_referrals')
        .select('id, referrer_id')
        .eq('referred_id', order.client_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (clientReferral) {
        await supabase
          .from('sh_referrals')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', clientReferral.id);

        await supabase.from('sh_coupons').insert({
          code: `CLI-${clientReferral.referrer_id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          discount_mxn: 100,
          max_uses: 1,
          current_uses: 0,
          status: 'active',
          created_by: clientReferral.referrer_id,
          target_user_id: clientReferral.referrer_id,
          description: 'Bono por referido de cliente'
        });
      }
    }
  }
}

export async function addEvidencePhoto(orderId: string, photoUrl: string): Promise<void> {
  const { data: order, error: fetchErr } = await supabase
    .from('sh_orders')
    .select('evidence_photos')
    .eq('id', orderId)
    .single();

  if (fetchErr) throw fetchErr;

  const currentPhotos = (order as SupabaseOrder).evidence_photos ?? [];
  const { error } = await supabase
    .from('sh_orders')
    .update({ evidence_photos: [...currentPhotos, photoUrl] })
    .eq('id', orderId);

  if (error) throw error;
}

export async function uploadEvidencePhoto(file: File, orderId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `evidence/${orderId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('sh-evidence')
    .upload(path, file, { contentType: file.type });

  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from('sh-evidence')
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;
  await addEvidencePhoto(orderId, publicUrl);
  return publicUrl;
}

export async function processClientCancellation(
  orderId: string,
  clientId: string
): Promise<{ success: boolean; fee_mxn: number; message: string }> {
  const { data, error } = await supabase
    .rpc('process_client_cancellation', {
      p_booking_id: orderId,
      p_client_id: clientId
    });

  if (error) throw error;
  return data;
}

export async function processSpecialistCancellation(
  orderId: string,
  specialistId: string
): Promise<{ success: boolean; penalty_mxn: number; message: string }> {
  const { data, error } = await supabase
    .rpc('process_specialist_cancellation', {
      p_booking_id: orderId,
      p_specialist_id: specialistId
    });

  if (error) throw error;
  return data;
}

export async function fetchOrdersByTechnician(technicianId: string): Promise<EscrowOrder[]> {
  const { data: orders, error } = await supabase
    .from('sh_orders')
    .select('*')
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const results: EscrowOrder[] = [];
  for (const order of orders as SupabaseOrder[]) {
    const { data: tech } = await supabase
      .from('sh_technicians')
      .select('*')
      .eq('id', order.technician_id)
      .single();

    if (tech) {
      results.push(mapOrder(order, tech as Technician));
    }
  }

  return results;
}
