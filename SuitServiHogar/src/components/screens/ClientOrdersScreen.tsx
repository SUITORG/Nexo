import React, { useEffect, useState } from 'react';
import { EscrowOrder } from '../../types';
import { fetchOrdersByClient } from '../../services/bookingService';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdersByClient(clientId)
      .then(setOrders)
      .catch((err) => console.error('Error cargando ordenes:', err))
      .finally(() => setLoading(false));
  }, [clientId]);

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
            </div>
          );
        })}
      </div>
    </div>
  );
};
