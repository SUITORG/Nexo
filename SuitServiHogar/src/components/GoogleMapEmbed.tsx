import React, { useMemo } from 'react';
import { ObfuscatedLocation, getGoogleMapsEmbedUrl, getGoogleMapsStaticUrl } from '../services/gpsService';

interface GoogleMapEmbedProps {
  location: ObfuscatedLocation | null;
  title?: string;
  height?: number;
  staticMap?: boolean;
}

export const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  location,
  title = 'Ubicación aproximada',
  height = 200,
  staticMap = false,
}) => {
  if (!location) {
    return (
      <div className="bg-surface-alt rounded-xl h-[200px] flex items-center justify-center border border-border-subtle">
        <p className="text-text-muted text-body-sm">Sin ubicación disponible</p>
      </div>
    );
  }

  const embedUrl = useMemo(() => getGoogleMapsEmbedUrl(location), [location]);
  const staticUrl = useMemo(() => getGoogleMapsStaticUrl(location, 15, '400x300'), [location]);

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-slate-100">
      <div className="bg-trust-blue-light px-3 py-1.5 border-b border-border-subtle">
        <h3 className="text-label-sm font-bold text-primary">{title}</h3>
        <p className="text-[10px] text-primary/80">Radio de seguridad: ~{location.radius}m</p>
      </div>
      {staticMap ? (
        <img
          src={staticUrl}
          alt={title}
          className="w-full h-[200px] object-cover"
          loading="lazy"
        />
      ) : (
        <iframe
          title={title}
          src={embedUrl}
          className="w-full"
          style={{ height: `${height}px` }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </div>
  );
};

export const TechnicianMapCard: React.FC<{
  technicianName: string;
  location: ObfuscatedLocation | null;
}> = ({ technicianName, location }) => {
  return (
    <div className="bg-surface-card rounded-xl p-3 border border-border-subtle shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">engineering</span>
          <h4 className="text-label-md font-bold text-text-primary">{technicianName}</h4>
        </div>
        {location && (
          <span className="text-label-sm font-bold bg-emerald-safe-bg text-escrow-shield border border-secondary-container px-2 py-0.5 rounded-full">
            ACTIVO {location.radius}m
          </span>
        )}
      </div>
      <GoogleMapEmbed location={location} height={180} staticMap={true} />
    </div>
  );
};