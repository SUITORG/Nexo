import { supabase } from '../lib/supabase';
import { Technician } from '../types';

interface SupabaseTechnician {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  review_count: number;
  distance: string;
  colonia: string;
  verified_badges: string[];
  tags: string[];
  price_mxn: number;
  price_usd: number;
  price_description: string;
  availability_badge: string;
  years_experience: number | null;
  level: number | null;
  bio: string | null;
  certifications: string[] | null;
  email: string | null;
  stripe_account_id: string | null;
}

function mapTechnician(row: SupabaseTechnician): Technician {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    title: row.title,
    rating: row.rating,
    reviewCount: row.review_count,
    distance: row.distance,
    colonia: row.colonia,
    verifiedBadges: row.verified_badges,
    tags: row.tags,
    priceMxn: row.price_mxn,
    priceUsd: row.price_usd,
    priceDescription: row.price_description,
    availabilityBadge: row.availability_badge,
    yearsExperience: row.years_experience ?? undefined,
    level: row.level ?? undefined,
    bio: row.bio ?? undefined,
    certifications: row.certifications ?? undefined,
    email: row.email ?? undefined,
    stripeAccountId: row.stripe_account_id ?? undefined
  };
}

export async function fetchTechnicians(colonia?: string): Promise<Technician[]> {
  let query = supabase
    .from('sh_technicians')
    .select('*')
    .eq('active', true)
    .order('rating', { ascending: false });

  if (colonia && colonia !== 'Todas') {
    query = query.eq('colonia', colonia);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as SupabaseTechnician[]).map(mapTechnician);
}

export async function fetchTechnicianById(id: string): Promise<Technician | null> {
  const { data, error } = await supabase
    .from('sh_technicians')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapTechnician(data as SupabaseTechnician);
}

export async function fetchTechniciansByCategory(categoryId: string, colonia?: string): Promise<Technician[]> {
  let query = supabase
    .from('sh_technicians')
    .select('*')
    .eq('active', true)
    .contains('category_ids', [categoryId])
    .order('rating', { ascending: false });

  if (colonia && colonia !== 'Todas') {
    query = query.eq('colonia', colonia);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as SupabaseTechnician[]).map(mapTechnician);
}

export async function saveStripeAccountId(technicianId: string, stripeAccountId: string): Promise<void> {
  const { error } = await supabase
    .from('sh_technicians')
    .update({ stripe_account_id: stripeAccountId })
    .eq('id', technicianId);

  if (error) throw error;
}
