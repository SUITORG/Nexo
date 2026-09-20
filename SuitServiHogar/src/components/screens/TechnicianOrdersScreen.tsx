import React, { useEffect, useState, useRef } from 'react';
import { EscrowOrder, Technician } from '../../types';
import { fetchOrdersByTechnician, updateOrderStatus, processSpecialistCancellation, uploadEvidencePhoto } from '../../services/bookingService';

interface TechnicianOrdersScreenProps {
  technician: Technician;
  onBack: () => void;
  onOpenChat: (orderId: string, orderIdShort: string, clientName: string) => void;
  onReview: (orderId: string, revieweeId: string, revieweeName: string, reviewerRole: 'client' | 'technician') => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'text-text-muted' },
  funded: { label: 'Pagada (Escrow)', color: 'text-primary' },
  in_progress: { label: 'En ruta / Trabajando', color: 'text-warning-flag' },
  completed: { label: 'Completado (esperando PIN)', color: 'text-escrow-shield' },
  released: { label: 'Liberado / Pagado', color: 'text-secondary' }
};

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string; color: string }> = {
  funded: { label: 'Iniciar ruta', nextStatus: 'in_progress', color: 'bg-primary' },
  in_progress: { label: 'Marcar completado', nextStatus: 'completed', color: 'bg-trust-blue-light' },
  completed: { label: 'Finalizar (PIN cliente)', nextStatus: 'released', color: 'bg-secondary' }
};

export const TechnicianOrdersScreen: React.FC<TechnicianOrdersScreenProps> = ({
  technician,
  onBack,
  onOpenChat,
  onReview
}) => {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activas' | 'historial'>('activas');
  const [pinInput, setPinInput] = useState('');
  const [pinOrderId, setPinOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [technician.id]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrdersByTechnician(technician.id);
      setOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    if (nextStatus === 'released') {
      setPinOrderId(orderId);
      setPinInput('');
      return;
    }
    try {
      await updateOrderStatus(orderId, nextStatus as any);
      await loadOrders();
    } catch (err) {
      console.error('Error actualizando status:', err);
    }
  };

  const handlePinConfirm = async () => {
    if (!pinOrderId || pinInput.length !== 4) return;
    try {
      await updateOrderStatus(pinOrderId, 'released');
      setPinOrderId(null);
      await loadOrders();
    } catch (err) {
      console.error('Error liberando fondos:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    try {
      const result = await processSpecialistCancellation(cancelOrderId, technician.id);
      setCancelOrderId(null);
      await loadOrders();
    } catch (err) {
      console.error('Error cancelando orden:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetOrderId) return;
    setUploading(true);
    try {
      await uploadEvidencePhoto(file, targetOrderId);
      await loadOrders();
    } catch (err) {
      console.error('Error subiendo foto:', err);
    } finally {
      setUploading(false);
      setTargetOrderId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeOrders = orders.filter(o => ['funded', 'in_progress', 'completed'].includes(o.status));
  const historyOrders = orders.filter(o => ['released'].includes(o.status));

  const displayOrders = activeTab === 'activas' ? activeOrders : historyOrders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-14">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-medium">Mis Órdenes</span>
        </button>
        <span className="text-label-sm text-text-muted">{technician.name}</span>
      </div>

      <div className="flex gap-2 bg-surface-card rounded-lg p-1 border border-border-subtle">
        <button
          onClick={() => setActiveTab('activas')}
          className={`flex-1 py-2 rounded-md text-label-md font-semibold transition-colors ${
            activeTab === 'activas'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Activas ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2 rounded-md text-label-md font-semibold transition-colors ${
            activeTab === 'historial'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Historial ({historyOrders.length})
        </button>
      </div>

      {displayOrders.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">
            {activeTab === 'activas' ? 'assignment_turned_in' : 'history'}
          </span>
          <p>{activeTab === 'activas' ? 'No hay órdenes activas' : 'Sin historial aún'}</p>
        </div>
      )}

      <div className="space-y-3">
        {displayOrders.map((order) => {
          const statusInfo = STATUS_LABELS[order.status];
          const action = STATUS_ACTIONS[order.status];
          const isCompleted = order.status === 'completed';

          return (
            <div
              key={order.id}
              className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-label-sm font-bold px-2 py-0.5 rounded-full border ${
                      statusInfo.color
                    }`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-label-sm text-text-muted">#{order.id.slice(-6)}</span>
                  </div>
                  <h3 className="text-label-lg font-bold text-text-primary mt-1 truncate">
                    {order.serviceTitle}
                  </h3>
                  <p className="text-body-sm text-text-muted mt-0.5">{order.serviceDescription}</p>
                  <div className="flex items-center gap-3 mt-2 text-body-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {order.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {order.timeWindow}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {order.zoneName}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-currency-display text-text-primary font-bold">
                    ${order.totalMxn.toLocaleString()} MXN
                  </div>
                  <div className="text-body-sm text-text-muted">~${order.totalUsd.toFixed(2)} USD</div>
                </div>
              </div>

              {action && (
                <div className="pt-2 border-t border-border-subtle flex gap-2">
                  <button
                    onClick={() => handleStatusChange(order.id, action.nextStatus)}
                    className={`flex-1 ${action.color} text-white py-2 px-3 rounded-lg font-bold text-label-md shadow-xs active:scale-95 transition-transform`}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1">
                      {order.status === 'funded' ? 'directions_car' : order.status === 'in_progress' ? 'check_circle' : 'lock_open'}
                    </span>
                    {action.label}
                  </button>
                  {(order.status === 'funded' || order.status === 'in_progress') && (
                    <>
                      <button
                        onClick={() => onOpenChat(order.id, order.id.slice(-6), 'Cliente')}
                        className="py-2 px-3 rounded-lg font-bold text-label-md bg-trust-blue-light text-primary border border-primary/20 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                      <button
                        onClick={() => setCancelOrderId(order.id)}
                        className="py-2 px-3 rounded-lg font-bold text-label-md bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {isCompleted && (
                <div className="pt-2 border-t border-border-subtle bg-emerald-safe-bg/30 rounded-lg p-3 space-y-2">
                  <p className="text-label-sm text-escrow-shield font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Orden completada — esperando PIN del cliente para liberar fondos
                  </p>
                  <button
                    onClick={() => onReview(order.id, order.clientId, 'Cliente', 'technician')}
                    className="w-full py-2 px-3 rounded-lg font-bold text-label-md bg-trust-blue-light text-primary border border-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">star</span>
                    Calificar al cliente
                  </button>
                </div>
              )}

              {order.status === 'in_progress' && (
                <div className="pt-2 border-t border-border-subtle flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => { setTargetOrderId(order.id); fileInputRef.current?.click(); }}
                    disabled={uploading && targetOrderId === order.id}
                    className="flex-1 bg-trust-blue-light text-primary py-2 px-3 rounded-lg font-bold text-label-md border border-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1">photo_camera</span>
                    {uploading && targetOrderId === order.id ? 'Subiendo...' : 'Subir Evidencia'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pinOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-card rounded-xl p-6 w-full max-w-sm border border-border-subtle space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm font-bold text-text-primary">Confirmar liberación</h3>
              <button onClick={() => setPinOrderId(null)} className="text-text-muted">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-body-sm text-text-muted">
              Pide al cliente el PIN de 4 dígitos para liberar los ${orders.find(o => o.id === pinOrderId)?.totalMxn.toLocaleString()} MXN retenidos en Escrow.
            </p>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  value={pinInput[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d?$/.test(val)) {
                      const arr = pinInput.split('');
                      arr[i] = val;
                      setPinInput(arr.join(''));
                      if (val && i < 3) {
                        const next = document.querySelectorAll('input[type="password"]')[i + 1] as HTMLInputElement;
                        next?.focus();
                      }
                    }
                  }}
                  className="w-12 h-12 text-center text-2xl font-bold bg-surface-alt border border-border-subtle rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button
              onClick={handlePinConfirm}
              disabled={pinInput.length !== 4}
              className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-bold text-label-lg shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Liberar fondos
            </button>
          </div>
        </div>
      )}

      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-card rounded-xl p-6 w-full max-w-sm border border-border-subtle space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm font-bold text-red-500">Cancelar orden</h3>
              <button onClick={() => setCancelOrderId(null)} className="text-text-muted">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-body-sm text-text-muted">
              Si cancelas menos de 2 horas antes de la cita, se aplicará una penalización de <strong>$150 MXN</strong>, descuento de <strong>0.2★</strong> y un cupón de <strong>$100 MXN</strong> para el cliente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelOrderId(null)}
                disabled={cancelling}
                className="flex-1 py-2 px-3 rounded-lg font-bold text-label-md bg-surface-alt text-text-primary border border-border-subtle active:scale-95"
              >
                Volver
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2 px-3 rounded-lg font-bold text-label-md bg-red-500 text-white active:scale-95 disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};