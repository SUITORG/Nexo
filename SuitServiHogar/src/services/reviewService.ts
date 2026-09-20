import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_role: 'client' | 'technician';
  rating: number;
  comment?: string;
  created_at: string;
}

// Moderación simple — palabras ofensivas (ponytail: lista corta, expandir cuando haga falta)
const BANNED = ['puto', 'puta', 'pendejo', 'pendeja', 'mierda', 'imbécil', 'imbecil', 'estúpido', 'estupido', 'pendejo', 'hijo de puta', 'culero', 'culera', 'cabrón', 'cabrona', 'chinga', 'chingue', 'pinche'];

export function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED.some((w) => lower.includes(w));
}

export async function submitReview(
  orderId: string,
  reviewerId: string,
  revieweeId: string,
  reviewerRole: 'client' | 'technician',
  rating: number,
  comment?: string
): Promise<Review> {
  const id = `REV-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await supabase
    .from('sh_reviews')
    .insert({
      id,
      order_id: orderId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      reviewer_role: reviewerRole,
      rating,
      comment: comment || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

export async function fetchReviewsForTechnician(technicianId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('sh_reviews')
    .select('*')
    .eq('reviewee_id', technicianId)
    .eq('reviewer_role', 'client')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchReviewsByClient(clientId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('sh_reviews')
    .select('*')
    .eq('reviewer_id', clientId)
    .eq('reviewer_role', 'client')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function hasUserReviewedOrder(orderId: string, reviewerRole: 'client' | 'technician'): Promise<boolean> {
  const { count } = await supabase
    .from('sh_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .eq('reviewer_role', reviewerRole);

  return (count ?? 0) > 0;
}

export async function getTechnicianStats(technicianId: string): Promise<{
  avgRating: number;
  totalReviews: number;
  completedServices: number;
  consecutiveFiveStars: number;
}> {
  // Rating promedio + total reseñas
  const { data: reviews } = await supabase
    .from('sh_reviews')
    .select('rating')
    .eq('reviewee_id', technicianId)
    .eq('reviewer_role', 'client');

  const totalReviews = reviews?.length ?? 0;
  const avgRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Servicios completados (from sh_orders)
  const { count: completedServices } = await supabase
    .from('sh_orders')
    .select('*', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .eq('status', 'completed');

  // Estrellas 5 consecutivas (desde la más reciente)
  let consecutiveFiveStars = 0;
  if (reviews && reviews.length > 0) {
    for (const r of reviews) {
      if (r.rating === 5) consecutiveFiveStars++;
      else break;
    }
  }

  return { avgRating: Math.round(avgRating * 10) / 10, totalReviews, completedServices: completedServices ?? 0, consecutiveFiveStars };
}
