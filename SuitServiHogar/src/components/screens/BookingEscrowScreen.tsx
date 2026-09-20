import React, { useState } from 'react';
import { Currency, EscrowOrder } from '../../types';
import { useStripePayment } from '../../hooks/useStripePayment';
import { createOrder } from '../../services/bookingService';
import { getCurrentPosition, obfuscateLocation } from '../../services/gpsService';
import { useElements } from '@stripe/react-stripe-js';
import { StripeCardInput } from '../StripeCardInput';
import { getRateSync } from '../../lib/constants';
import { PriceNegotiation } from '../PriceNegotiation';

interface BookingEscrowScreenProps {
  order: EscrowOrder;
  currency: Currency;
  onPaySuccess: () => void;
  onPayError: (msg: string) => void;
  onBack: () => void;
  onShowRules: () => void;
  stripeAccountId?: string;
  userId?: string;
}

export const BookingEscrowScreen: React.FC<BookingEscrowScreenProps> = ({
  order,
  currency,
  onPaySuccess,
  onPayError,
  onBack,
  onShowRules,
  stripeAccountId,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState(order.date);
  const [selectedWindow, setSelectedWindow] = useState(order.timeWindow);
  const [photos, setPhotos] = useState<string[]>(order.evidencePhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [street, setStreet] = useState(order.street || '');
  const [number, setNumber] = useState(order.number || '');
  const [gettingGPS, setGettingGPS] = useState(false);

  const { createPaymentIntent, confirmPayment, processing } = useStripePayment();
  const elements = useElements();
  const [googlePayReady, setGooglePayReady] = useState(false);
  const rate = getRateSync();

  const handleGooglePay = async (paymentMethodId: string) => {
    try {
      const result = await createPaymentIntent(order, stripeAccountId, couponCode || undefined);
      const payResult = await confirmPayment(null, result.clientSecret, paymentMethodId);
      if (payResult.success) {
        try {
          await createOrder(order.technician.id, order.serviceTitle, order.serviceDescription, userId || 'guest', order.zoneName, {
            street,
            number,
            gpsLat: order.gpsLat,
            gpsLng: order.gpsLng
          });
        } catch (_) {}
        onPaySuccess();
      } else {
        onPayError(payResult.error || 'Error al procesar el pago con Google Pay');
      }
    } catch (err: any) {
      onPayError(err.message || 'Error al procesar el pago con Google Pay');
    }
  };

  const handlePay = async () => {
    if (!elements) {
      onPayError('Sistema de pago no disponible');
      return;
    }

    const cardElement = elements.getElement('card');
    if (!cardElement) {
      onPayError('Ingresa los datos de tu tarjeta');
      return;
    }

    try {
      const result = await createPaymentIntent(order, stripeAccountId, couponCode || undefined);
      const payResult = await confirmPayment(cardElement, result.clientSecret);
      if (payResult.success) {
        try {
          await createOrder(order.technician.id, order.serviceTitle, order.serviceDescription, userId || 'guest', order.zoneName, {
            street,
            number,
            gpsLat: order.gpsLat,
            gpsLng: order.gpsLng
          });
        } catch (_) {}
        onPaySuccess();
      } else {
        onPayError(payResult.error || 'Error al procesar el pago');
      }
    } catch (err: any) {
      onPayError(err.message || 'Error al procesar el pago');
    }
  };

  const formatMxnUsd = (mxn: number, usd: number) => {
    if (currency === 'USD') {
      return `$${usd.toFixed(2)} USD (~$${mxn.toFixed(2)} MXN)`;
    }
    return `$${mxn.toFixed(2)} MXN (~$${usd.toFixed(2)} USD)`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Banner */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-safe-bg text-escrow-shield border border-secondary-container rounded-full text-label-sm font-bold tracking-wider">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          TRANSMISIÓN BLINDADA • PROTOCOLO SEGURO REYNOSA
        </span>
      </div>

      {/* Title & Subtitle */}
      <div>
        <h1 className="text-headline-lg font-bold text-text-primary tracking-tight">
          Solicitud de Servicio y Custodia Escrow
        </h1>
        <p className="text-body-md text-text-muted mt-1 leading-relaxed">
          Formaliza tu orden con tarifa congelada y protección antifraude.
        </p>
      </div>

      {/* Order Ref & Summary Card */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-md font-bold text-text-muted">
            ORDEN REF: <span className="text-primary font-mono">{order.id}</span>
          </span>
          <span className="text-label-sm font-bold bg-emerald-safe-bg text-escrow-shield px-2 py-0.5 rounded border border-secondary-container">
            PRECIO REGULADO
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1 pr-2">
            <h2 className="text-headline-sm font-bold text-text-primary leading-tight">
              {order.serviceTitle}
            </h2>
            <p className="text-body-sm text-text-muted">
              {order.serviceDescription}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">mode_fan</span>
          </div>
        </div>

        {/* Technician Card */}
        <div className="bg-surface-alt rounded-lg p-3 border border-border-subtle space-y-2">
          <div className="flex items-center space-x-3">
            <div className="relative shrink-0">
              <img
                src={order.technician.avatar}
                alt={order.technician.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border-2 border-surface-card"
              />
              <span className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-0.5 text-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px]">verified</span>
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-label-lg font-bold text-text-primary truncate">
                  {order.technician.name}
                </h3>
                <span className="text-label-sm font-bold text-tertiary-container bg-amber-rating-bg border border-tertiary-fixed-dim px-1.5 py-0.2 rounded">
                  ★ {order.technician.rating} ({order.technician.reviewCount})
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-body-sm text-text-muted mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-escrow-shield">home_pin</span>
                <span className="truncate">Auditado presencialmente en domicilio</span>
              </div>
              <div className="flex items-center space-x-2 text-body-sm text-text-muted">
                <span>{order.technician.distance}</span>
                <span>•</span>
                <span className="font-semibold text-text-primary">
                  {order.technician.yearsExperience || 9} años exp.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-label-sm">
            <span className="flex items-center gap-1 text-tertiary-container font-semibold">
              <span className="material-symbols-outlined text-[14px]">military_tech</span>
              Distintivo Técnico Certificado de Confianza (10+ servicios con 5★)
            </span>
            <span className="font-bold text-primary">Nivel 4</span>
          </div>
        </div>
      </section>

      {/* Blindaje de Privacidad Espacial */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[20px]">visibility_off</span>
            <div>
              <h2 className="text-label-lg font-bold text-text-primary">
                Blindaje de Privacidad Espacial
              </h2>
              <p className="text-[11px] text-text-muted">PostGIS Ring Radius de Seguridad</p>
            </div>
          </div>
          <span className="text-label-sm font-bold bg-emerald-safe-bg text-escrow-shield border border-secondary-container px-2 py-0.5 rounded-full">
            ACTIVO 200m
          </span>
        </div>

        {/* Map Graphic with concentric rings */}
        <div className="relative h-44 rounded-xl overflow-hidden border border-border-subtle bg-slate-100 flex items-center justify-center">
          {/* Stylized Map Background Pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(#0F4C81 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
              backgroundSize: '16px 16px, 48px 48px, 48px 48px'
            }}
          />

          {/* Map roads/labels illusion */}
          <div className="absolute top-2 left-3 text-[10px] text-text-muted font-mono uppercase bg-white/80 px-1.5 py-0.5 rounded">
            Contratación & Garantía Escrow
          </div>

          {/* Concentric rings */}
          <div className="relative flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-2 border-primary/20 bg-primary/5 flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
              </div>
            </div>

            {/* Radius Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-border-subtle shadow-xs whitespace-nowrap flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
              Radio aproximado: 150m - 250m
            </div>
          </div>

          {/* Location Badge bottom */}
          <div className="absolute bottom-2 right-3 bg-text-primary/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
            {order.zoneName}
          </div>
        </div>

        {/* Explain text */}
        <div className="p-3 bg-trust-blue-light/70 rounded-lg border border-primary/20 flex items-start space-x-2.5 text-body-sm text-text-primary">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
            shield
          </span>
          <p className="leading-relaxed">
            Tu dirección exacta solo se comparte una vez que el técnico confirme la cita en ruta. Hasta entonces, el contratista solo visualiza tu zona aproximada para calcular traslados sin comprometer la seguridad de tu hogar.
          </p>
        </div>
      </section>

      {/* Protocolo Antifuga y Registro Técnico */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-label-lg font-bold text-text-primary">
              Protocolo Antifuga y Registro Técnico
            </h2>
            <span className="text-[10px] font-bold bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim px-1.5 py-0.2 rounded">
              OBLIGATORIO
            </span>
          </div>
          <button
            onClick={onShowRules}
            className="text-body-sm font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[15px]">help_outline</span>
            Reglas
          </button>
        </div>

        <p className="text-body-sm text-text-muted">
          Agrega foto o video breve del equipo o daño para fijar precio final sin renegociación.
        </p>

        {/* Evidence Photos Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden border border-border-subtle aspect-square group shadow-xs"
            >
              <img
                src={photo}
                alt={`Evidencia ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                {index === 0 ? '08:42 REY-GPS' : 'PLACA-MODELO'}
              </span>
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center shadow-sm"
                title="Eliminar foto"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}

          {/* Add Photo Button */}
          <label className="border-2 border-dashed border-border-subtle hover:border-primary rounded-lg aspect-square flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors bg-surface-alt hover:bg-surface-card">
            <span className="material-symbols-outlined text-text-muted text-[24px]">add_a_photo</span>
            <span className="text-label-sm font-bold text-primary mt-1">Adjuntar</span>
            <span className="text-[9px] text-text-muted">Max 15MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-start space-x-2 text-body-sm text-text-muted pt-1">
          <span className="material-symbols-outlined text-escrow-shield text-[16px] shrink-0 mt-0.5">
            verified
          </span>
          <p className="leading-snug">
            La evidencia fotográfica se asocia a la cadena inmutable de custodia para el peritaje de liberación de fondos en caso de aclaraciones.
          </p>
        </div>
      </section>

      {/* Horario y Turno Preferido */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
            <h2 className="text-label-lg font-bold text-text-primary">
              Horario y Turno Preferido
            </h2>
          </div>
          <span className="text-label-sm font-bold text-primary">Turno Matutino</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">
                Día coordinado
              </span>
              <span className="text-label-md font-bold text-text-primary mt-0.5 block">
                {selectedDate}
              </span>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">event</span>
          </div>

          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">
                Ventana puntual
              </span>
              <span className="text-label-md font-bold text-text-primary mt-0.5 block">
                {selectedWindow}
              </span>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
          </div>
        </div>

        <p className="text-body-sm text-text-muted leading-snug">
          Alineado a turnos industriales de Reynosa: confirmación previa de 30 minutos vía satélite.
        </p>
      </section>

      {/* Dirección del Servicio + GPS */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <h2 className="text-label-lg font-bold text-text-primary">
              Dirección del Servicio
            </h2>
          </div>
          <span className="text-label-sm font-bold bg-trust-blue-light text-primary px-2 py-0.5 rounded border border-primary/20">
            OBLIGATORIO
          </span>
        </div>

        <p className="text-body-sm text-text-muted">
          Ingresa la dirección exacta. El técnico solo verá tu zona aproximada (radio 150-250m) hasta confirmar la cita.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2">
            <label className="text-[10px] text-text-muted uppercase tracking-wider block font-bold mb-1">
              Calle / Av. Principal
            </label>
            <input
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="Ej: Av. Monterrey, Blvd. Hidalgo"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-md bg-surface-alt text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block font-bold mb-1">
              Número
            </label>
            <input
              type="text"
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="Ej: 1245"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-body-md bg-surface-alt text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (gettingGPS) return;
              setGettingGPS(true);
              try {
                const pos = await getCurrentPosition();
                const obs = obfuscateLocation(pos);
                setStreet(`Lat: ${obs.lat.toFixed(6)}, Lng: ${obs.lng.toFixed(6)} (aprox.)`);
                setNumber(`Radio ${obs.radius}m`);
              } catch {
                setStreet('Error GPS');
              } finally {
                setGettingGPS(false);
              }
            }}
            disabled={gettingGPS}
            className="flex-1 py-2 bg-trust-blue-light hover:bg-trust-blue text-primary rounded-lg font-label-md font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">my_location</span>
            <span>{gettingGPS ? 'Obteniendo...' : 'Usar mi GPS'}</span>
          </button>
          <span className="flex items-center text-body-sm text-text-muted px-2">
            <span className="material-symbols-outlined text-[14px] text-escrow-shield">visibility_off</span>
            Blindaje 150-250m
          </span>
        </div>

        {(order.gpsLat && order.gpsLng) && (
          <div className="p-3 bg-trust-blue-light/70 rounded-lg border border-primary/20 flex items-start space-x-2.5 text-body-sm text-text-primary">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
              shield
            </span>
            <p className="leading-relaxed">
              Ubicación aproximada guardada: {order.gpsLat.toFixed(4)}, {order.gpsLng.toFixed(4)} (radio 200m).
              La dirección exacta ({order.street} #{order.number}) se revela al técnico al confirmar.
            </p>
          </div>
        )}
      </section>

      {/* Desglose Financiero Bimonetario Transparente */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <h2 className="text-headline-sm font-bold text-text-primary">
              Desglose Financiero Bimonetario Transparente
            </h2>
          </div>
          <span className="text-label-sm font-bold text-text-muted flex items-center gap-1">
            TC: {order.exchangeRate}
            <span className="material-symbols-outlined text-[14px]">sync</span>
          </span>
        </div>

        <div className="space-y-2 text-body-md divide-y divide-border-subtle pt-1">
          <div className="flex justify-between items-center pt-2">
            <span className="text-text-primary">Tarifa base de tabulador</span>
            <div className="text-right">
              <span className="font-bold text-text-primary block">$650.00 MXN</span>
              <span className="text-body-sm text-text-muted">~$35.00 USD</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-text-primary">Cobertura de Garantía y Seguro RC</span>
              <span className="material-symbols-outlined text-escrow-shield text-[16px]">verified</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-secondary block">Incluido ($0.00)</span>
              <span className="text-[11px] text-text-muted">Póliza civil 2026</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-text-primary block">Retención fiscal integrada SAT (CFDI)</span>
              <span className="text-label-sm font-bold text-primary bg-trust-blue-light px-1.5 py-0.2 rounded border border-primary/20">
                ISR 2.1% / IVA 8%
              </span>
            </div>
            <span className="text-body-sm text-text-muted font-medium">Incluido en tarifa</span>
          </div>

          <div className="flex justify-between items-center pt-3">
            <div>
              <span className="text-label-lg font-bold text-text-primary block">
                Total en Depósito Escrow:
              </span>
              <span className="text-body-sm text-text-muted">Fondos retenidos en Stripe Connect</span>
            </div>
            <div className="text-right">
              {couponDiscount > 0 && (
                <span className="text-body-sm text-escrow-shield font-bold block">
                  -$${couponDiscount.toFixed(2)} MXN (cupón)
                </span>
              )}
              <span className="text-headline-lg font-bold text-primary block tracking-tight">
                ${couponDiscount > 0 ? Math.max(order.totalMxn - couponDiscount, 0).toFixed(2) : order.totalMxn.toFixed(2)} MXN
              </span>
              <span className="text-body-sm text-text-muted font-semibold">
                (~$${couponDiscount > 0 ? Math.max(order.totalUsd - couponDiscount / rate, 0).toFixed(2) : order.totalUsd.toFixed(2)} USD)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cupón de Descuento */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-amber-dark text-[20px]">confirmation_number</span>
          <h2 className="text-label-lg font-bold text-text-primary">Cupón de Descuento</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponMessage(''); setCouponDiscount(0); }}
            placeholder="Código de cupón"
            className="flex-1 px-3 py-2 border border-border-subtle rounded-lg text-body-md bg-surface-alt text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={8}
          />
          <button
            onClick={async () => {
              if (!couponCode.trim()) return;
              setValidatingCoupon(true);
              try {
                const res = await fetch('/api/validate-coupon', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: couponCode })
                });
                const data = await res.json();
                setCouponDiscount(data.valid ? data.discountMxn : 0);
                setCouponMessage(data.message);
              } catch {
                setCouponMessage('Error al validar cupón');
              } finally {
                setValidatingCoupon(false);
              }
            }}
            disabled={validatingCoupon || !couponCode.trim()}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {validatingCoupon ? '...' : 'Aplicar'}
          </button>
</div>
        {couponMessage && (
          <p className={`text-body-sm font-medium ${couponDiscount > 0 ? 'text-escrow-shield' : 'text-error'}`}>
            {couponMessage}
          </p>
        )}
      </section>

      {/* Negociación de Precio */}
      <PriceNegotiation
        orderId={order.id}
        currentUserRole="client"
        currentPriceMxn={order.totalMxn}
      />

      {/* Custodia Financiera Escrow Activa */}
      <section className="bg-emerald-safe-bg/60 border border-secondary-container rounded-xl p-4 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2 text-escrow-shield font-bold">
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <h3 className="text-label-lg">Custodia Financiera Escrow Activa</h3>
        </div>
        <p className="text-body-md text-text-primary leading-relaxed">
          Tu pago queda en custodia segura (Escrow). No se transfiere al técnico hasta que confirmes la entrega del trabajo mediante firma o PIN. En caso de anomalía, el servicio técnico se repite sin costo o tu dinero se reintegra.
        </p>
      </section>

      {/* Datos de Tarjeta */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
          <h2 className="text-label-lg font-bold text-text-primary">
            Datos de Tarjeta
          </h2>
        </div>
        <p className="text-body-sm text-text-muted">
          Ingresa los datos de tu tarjeta para depositar la garantía Escrow.
        </p>
        <StripeCardInput
          onGooglePayClick={handleGooglePay}
          googlePayAvailable={true}
          amount={order.totalMxn}
          currency={currency}
        />
        <div className="flex items-center space-x-1.5 text-[11px] text-text-muted">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Pagos procesados por Stripe. No almacenamos datos de tarjeta.</span>
        </div>
      </section>

      {/* Safety Marks Footer */}
      <div className="flex items-center justify-around py-1 text-label-sm text-text-muted font-medium border-t border-border-subtle pt-3">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
          Stripe TLS 256-bit
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-escrow-shield">verified</span>
          Garantía 30 Días
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
          JWT Verified
        </span>
      </div>

      {/* Sticky Bottom Bar with CTA */}
      <div className="fixed bottom-14 left-0 right-0 max-w-lg mx-auto p-3 bg-surface-card/95 backdrop-blur-sm border-t border-border-subtle shadow-lg z-40">
        <button
          onClick={() => !processing && handlePay()}
          disabled={processing}
          className="w-full bg-primary hover:bg-trust-blue-dark text-white font-label-lg font-bold py-3.5 px-4 rounded-xl flex items-center justify-center shadow-md active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Procesando pago...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span>Pagar ${couponDiscount > 0 ? Math.max(order.totalMxn - couponDiscount, 0).toFixed(2) : order.totalMxn.toFixed(2)} MXN en Garantía Escrow</span>
              </div>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </div>
          )}
        </button>
        <p className="text-center text-label-sm text-text-muted mt-1.5">
          Procesado por <span className="font-bold text-text-primary">Stripe</span> • Cancelación gratuita antes de cita en ruta
        </p>
      </div>
    </div>
  );
};
