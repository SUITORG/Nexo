import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';

interface SupabaseCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
  base_price_mxn: number;
  subtitle: string;
  description: string;
}

function mapCategory(row: SupabaseCategory): ServiceCategory {
  return {
    id: row.id,
    name: row.name,
    count: row.count,
    icon: row.icon,
    basePriceMxn: row.base_price_mxn,
    subtitle: row.subtitle,
    description: row.description
  };
}

export async function fetchCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('sh_service_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data as SupabaseCategory[]).map(mapCategory);
}

export async function fetchCategoryById(id: string): Promise<ServiceCategory | null> {
  const { data, error } = await supabase
    .from('sh_service_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapCategory(data as SupabaseCategory);
}
