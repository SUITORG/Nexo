export type Currency = 'MXN' | 'USD';

export type ScreenId = 'inicio' | 'explorar' | 'escrow' | 'perfil' | 'solicitud' | 'tecnico' | 'chat' | 'review' | 'glossary' | 'admin' | 'privacy' | 'terms';

export interface Technician {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviewCount: number;
  distance: string;
  colonia: string;
  verifiedBadges: string[];
  tags: string[];
  priceMxn: number;
  priceUsd: number;
  priceDescription: string;
  availabilityBadge: string;
  yearsExperience?: number;
  level?: number;
  bio?: string;
  certifications?: string[];
  email?: string;
  stripeAccountId?: string;
  role?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
  basePriceMxn: number;
  subtitle: string;
  description: string;
}

export interface EscrowOrder {
  id: string;
  serviceTitle: string;
  serviceDescription: string;
  technician: Technician;
  clientId: string;
  date: string;
  timeWindow: string;
  basePriceMxn: number;
  basePriceUsd: number;
  guaranteePriceMxn: number;
  satRetentionMxn: number;
  totalMxn: number;
  totalUsd: number;
  exchangeRate: number;
  status: 'draft' | 'funded' | 'in_progress' | 'completed' | 'released';
  evidencePhotos: string[];
  zoneName: string;
  street?: string;
  number?: string;
  gpsLat?: number;
  gpsLng?: number;
}
