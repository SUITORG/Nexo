import React, { useEffect, useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { EscrowOrder } from '../../types';
import { fetchOrdersByClient } from '../../services/bookingService';
import { fetchInSituAdjustments, respondAdjustment, InSituAdjustment } from '../../services/adjustmentService';
import { StripeCardInput } from '../StripeCardInput';
import { getDevConfig } from '../../config/devMode';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'text-text-muted' },
  funded: { label: 'Pagada (Escrow)', color: 'text-primary' },
  in_progress: { label: 'En ruta / Trabajando', color: 'text-warning-flag' },
  completed: { label: 'Completado (esperando PIN)', color: 'text-escrow-shield' },
  released: { label: 'Liberado / Pagado', color: 'text-secondary' },
};

interface ClientOrdersScreenProps {
  clientId: string;
  onBack: () => void;
  onOpenChat: (orderId: string, orderIdShort: string, counterpartName: string) => void;
}

export const ClientOrdersScreen: React.FC<ClientOrdersScreenProps> = ({ clientId, onBack, onOpenChat }) => {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, InSituAdjustment>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const loadAll = async () => {
    const data = await fetchOrdersByClient(clientId);
    setOrders(data);
    setAdjustments(await fetchInSituAdjustments(data.map(o => o.id)));
  };

  useEffect(() => {
    loadAll()
      .catch((err) => console.error('Error cargando ordenes:', err))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleReject = async (orderId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await respondAdjustment(orderId, 'REJECT');
      setClientSecret(null);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'No se pudo rechazar el ajuste');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const dev = getDevConfig();
      const res = await respondAdjustment(orderId, 'ACCEPT', {
        mock: dev.enabled && dev.mockStripe ? true : undefined,
      });
      if ('clientSecret' in res) {
        setClientSecret(res.clientSecret);
      } else {
        // aceptado directo (modo prueba) — el total ya se actualizó
        setClientSecret(null);
        await loadAll();
      }
    } catch (err: any) {
      setActionError(err.message || 'No se pudo aprobar el ajuste');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCard = async (orderId: string) => {
    if (!stripe || !elements || !clientSecret) {
      setActionError('Sistema de pago no disponible');
      return;
    }
    const card = elements.getElement('card');
    if (!card) {
      setActionError('Ingresa los datos de tu tarjeta');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { name: 'Cliente ServiHogar' } },
      });
      if (error) throw new Error(error.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Pago del ajuste no completado');
      await respondAdjustment(orderId, 'ACCEPT', { paymentIntentId: paymentIntent.id });
      setClientSecret(null);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Error al cobrar el ajuste');
    } finally {
      setBusy(false);
    }
  };

  const pendingEntry = orders
    .map((order) => ({ order, adj: adjustments[order.id] }))
    .find(({ adj }) => adj?.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      <button onClick={onBack} className="flex items-center gap-2 text-text-primary">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-medium">Mis Órdenes</span>
      </button>

      <h1 className="text-headline-sm text-text-primary font-bold">Mis Órdenes de Servicio</h1>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">assignment_turned_in</span>
          <p>Aún no tienes órdenes</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const statusInfo = STATUS_LABELS[order.status];
          const adj = adjustments[order.id];
          return (
            <div
              key={order.id}
              className={`bg-surface-card rounded-xl p-4 border shadow-xs space-y-3 ${
                order.status === 'funded'
                  ? 'animate-order-pending border-amber-400/60'
                  : 'border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-label-sm font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-label-sm text-text-muted">#{order.id.slice(-6)}</span>
              </div>
              <h3 className="text-label-lg font-bold text-text-primary truncate">{order.serviceTitle}</h3>
              <div className="flex gap-3 text-body-sm text-text-muted">
                <span>{order.date}</span>
                <span>{order.timeWindow}</span>
                <span>{order.zoneName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-currency-display text-text-primary font-bold">
                  ${order.totalMxn.toLocaleString()} MXN
                </div>
                <button
                  onClick={() => onOpenChat(order.id, order.id.slice(-6), order.technician.name)}
                  className="flex items-center gap-1 bg-trust-blue-light text-primary border border-primary/20 px-3 py-2 rounded-lg font-bold text-label-md active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Chat
                </button>
              </div>
              {adj && adj.status === 'accepted' && (
                <div className="text-label-sm font-semibold rounded-lg px-3 py-2 border bg-emerald-safe-bg text-escrow-shield border-secondary-container">
                  ✅ Ajuste aprobado: +${adj.extra_amount_mxn?.toLocaleString()} MXN — nuevo total ${adj.agreed_price_mxn?.toLocaleString()} MXN
                </div>
              )}
              {adj && adj.status === 'rejected' && (
                <div className="text-label-sm font-semibold rounded-lg px-3 py-2 border bg-error/10 text-error border-error/30">
                  ❌ Rechazaste el ajuste — se mantiene el monto base
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Banner flotante: Aprobación de Ajuste de Precio (req #44) */}
      {pendingEntry && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-2xl mx-auto">
          <div className="bg-surface-card rounded-xl p-4 border-2 border-tertiary-fixed-dim shadow-lg space-y-3 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-label-lg font-bold text-text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[20px] text-tertiary-container">request_quote</span>
                  Aprobación de Ajuste de Precio
                </h4>
                <p className="text-label-sm text-text-muted">
                  {pendingEntry.order.serviceTitle} · #{pendingEntry.order.id.slice(-6)}
                </p>
              </div>
              <span className="text-label-sm font-bold px-2 py-0.5 rounded-full bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim shrink-0">
                ⏳ Pendiente
              </span>
            </div>

            {pendingEntry.adj.reason && (
              <p className="text-body-sm text-text-primary bg-surface-alt rounded-lg p-2">
                <span className="font-semibold">Motivo del técnico:</span> {pendingEntry.adj.reason}
              </p>
            )}

            <div className="space-y-1 p-3 bg-surface-alt rounded-lg text-body-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Monto base (ya en Escrow)</span>
                <span className="font-bold text-text-primary">${pendingEntry.adj.original_price_mxn.toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between text-tertiary-container">
                <span className="font-semibold">Monto adicional</span>
                <span className="font-bold">+${pendingEntry.adj.extra_amount_mxn?.toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border-subtle text-headline-sm font-bold text-text-primary">
                <span>Total nuevo</span>
                <span>${(pendingEntry.adj.original_price_mxn + (pendingEntry.adj.extra_amount_mxn || 0)).toLocaleString()} MXN</span>
              </div>
            </div>

            {!clientSecret ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(pendingEntry.order.id)}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg font-bold text-label-md bg-error/10 text-error border border-error/30 active:scale-95 disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleApprove(pendingEntry.order.id)}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg font-bold text-label-md bg-primary text-on-primary active:scale-95 disabled:opacity-50"
                >
                  {busy ? 'Procesando...' : 'Aprobar y pagar'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1 border-t border-border-subtle">
                <StripeCardInput amount={pendingEntry.adj.extra_amount_mxn || 0} />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setClientSecret(null); setActionError(null); }}
                    disabled={busy}
                    className="py-2.5 px-4 rounded-lg font-bold text-label-md bg-surface-alt text-text-primary border border-border-subtle active:scale-95 disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => handleConfirmCard(pendingEntry.order.id)}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-lg font-bold text-label-md bg-primary text-on-primary active:scale-95 disabled:opacity-50"
                  >
                    {busy ? 'Cobrando...' : `Pagar $${pendingEntry.adj.extra_amount_mxn?.toLocaleString()} MXN`}
                  </button>
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-body-sm text-error bg-error/10 rounded-lg p-2">{actionError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrdersScreen;
