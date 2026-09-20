import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDevConfig } from '../config/devMode';

const MOCK_USERS = {
  technician: {
    id: 'tech-dev-1',
    email: 'roberto@servihogar.mx',
    role: 'technician' as const,
    user_metadata: { name: 'Roberto Pérez (DEV)' },
  },
  client: {
    id: 'client-dev-1',
    email: 'guest@dev.local',
    role: 'client' as const,
    user_metadata: { name: 'Cliente Demo (DEV)' },
  },
  admin: {
    id: 'admin-dev-1',
    email: 'admin@servihogar.mx',
    role: 'admin' as const,
    user_metadata: { name: 'Admin Demo (DEV)' },
  },
};

const MOCK_TECHNICIAN = {
  id: 'tech-dev-1',
  name: 'Roberto Pérez',
  avatar: 'https://i.pravatar.cc/150?u=roberto-dev',
  title: 'Plomero Certificado',
  rating: 4.9,
  reviewCount: 127,
  distance: '0.5 km',
  colonia: 'Las Fuentes',
  verifiedBadges: ['INE + Biometría', 'Distintivo Dorado'],
  tags: ['Fugas', 'Instalaciones', 'Mantenimiento'],
  priceMxn: 650,
  priceUsd: 36.11,
  priceDescription: 'Incluye diagnóstico',
  availabilityBadge: 'Disponible',
  yearsExperience: 12,
  level: 5,
  bio: 'Plomero con 12 años de experiencia en sistemas hidráulicos residenciales e industriales. Especialista en detección de fugas sin excavación.',
  certifications: ['Certificación CONOCER', 'Especialista en fugas'],
  categoryIds: ['plomeria'],
  email: 'roberto@servihogar.mx',
  stripeAccountId: 'acct_dev_mock_123',
  active: true,
  createdAt: new Date().toISOString(),
};

export interface DevAuthSetters {
  setUser: (user: any) => void;
  setCurrentTechnician: (tech: any) => void;
  setAuthLoading: (loading: boolean) => void;
}

export function useDevAuth(setters: DevAuthSetters) {
  const { setUser, setCurrentTechnician, setAuthLoading } = setters;
  const config = getDevConfig();

  useEffect(() => {
    if (!config.enabled || !config.autoLogin) return;

    console.log('[DEV MODE] Auto-login activado:', config.autoLogin);

    const mockUser = MOCK_USERS[config.autoLogin];
    if (!mockUser) return;

    // Simula sesión activa
    const mockSession = {
      access_token: 'dev-mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'dev-refresh-token',
      user: mockUser,
    };

    // Setea usuario
    setUser(mockUser as any);
    setAuthLoading(false);

    // Si es técnico, carga datos mock
    if (config.autoLogin === 'technician') {
      setCurrentTechnician(MOCK_TECHNICIAN);
    }

    // Mock Supabase auth methods para desarrollo
    const originalGetUser = supabase.auth.getUser;
    supabase.auth.getUser = async () => ({
      data: { user: mockUser },
      error: null,
    }) as any;

    const originalOnAuthStateChange = supabase.auth.onAuthStateChange;
    supabase.auth.onAuthStateChange = ((callback: any) => {
      // Simula evento SIGNED_IN inmediato
      setTimeout(() => callback('SIGNED_IN', { ...mockSession, user: mockUser }), 0);
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }) as any;

    const originalSignInWithOAuth = supabase.auth.signInWithOAuth;
    supabase.auth.signInWithOAuth = async () => ({
      data: { user: mockUser, session: mockSession as any },
      error: null,
    }) as any;

    const originalSignOut = supabase.auth.signOut;
    supabase.auth.signOut = async () => ({
      error: null,
    });

    // Cleanup al desmontar
    return () => {
      supabase.auth.getUser = originalGetUser;
      supabase.auth.onAuthStateChange = originalOnAuthStateChange;
      supabase.auth.signInWithOAuth = originalSignInWithOAuth;
      supabase.auth.signOut = originalSignOut;
    };
  }, [config.enabled, config.autoLogin]);

  // Seed data si está habilitado
  useEffect(() => {
    if (!config.enabled || !config.seedData) return;

    console.log('[DEV MODE] Seed data habilitado - ejecutando seed...');
    
    // Dispara seed en backend
    fetch('/api/dev/seed', { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log('[DEV MODE] Seed result:', data))
      .catch(err => console.warn('[DEV MODE] Seed failed:', err));
  }, [config.enabled, config.seedData]);
}