import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/constants';

interface PriceNegotiationProps {
  orderId: string;
  currentUserRole: 'client' | 'technician';
  currentPriceMxn: number; // en centavos
  onAgreed?: (price: number) => void;
  onCancelled?: () => void;
}

export const PriceNegotiation: React.FC<PriceNegotiationProps> = ({
  orderId,
  currentUserRole,
  currentPriceMxn,
  onAgreed,
  onCancelled,
}) => {
  const [negotiation, setNegotiation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNegotiation();
  }, [orderId]);

  const loadNegotiation = async () => {
    try {
      const { data, error } = await supabase
        .from('sh_price_negotiations')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNegotiation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async (price: number) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      if (currentUserRole === 'client') {
        if (!negotiation) {
          const { data, error } = await supabase
            .from('sh_price_negotiations')
            .insert({
              order_id: orderId,
              client_id: user.id,
              technician_id: '',
              original_price_mxn: currentPriceMxn,
              client_offer_mxn: price,
              status: 'client_offered',
              initiated_by: 'client',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          setNegotiation(data);
        } else {
          const { data, error } = await supabase
            .from('sh_price_negotiations')
            .update({
              client_offer_mxn: price,
              status: 'client_offered',
              updated_at: new Date().toISOString(),
            })
            .eq('id', negotiation.id)
            .select()
            .single();

          if (error) throw error;
          setNegotiation(data);
        }
      } else {
        if (negotiation) {
          const updates: any = {
            technician_offer_mxn: price,
            status: 'technician_countered',
            updated_at: new Date().toISOString(),
          };

          if (price === negotiation.client_offer_mxn) {
            updates.status = 'accepted';
            updates.agreed_price_mxn = price;
          }

          const { data, error } = await supabase
            .from('sh_price_negotiations')
            .update(updates)
            .eq('id', negotiation.id)
            .select()
            .single();

          if (error) throw error;
          setNegotiation(data);

          if (updates.status === 'accepted' && onAgreed) {
            onAgreed(price);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!negotiation || currentUserRole !== 'technician') return;

    try {
      const { error } = await supabase
        .from('sh_price_negotiations')
        .update({
          status: 'accepted',
          agreed_price_mxn: negotiation.client_offer_mxn,
          updated_at: new Date().toISOString(),
        })
        .eq('id', negotiation.id);

      if (error) throw error;

      const updated = { ...negotiation, status: 'accepted', agreed_price_mxn: negotiation.client_offer_mxn };
      setNegotiation(updated);
      if (onAgreed) onAgreed(negotiation.client_offer_mxn!);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async () => {
    if (!negotiation) return;

    try {
      const { error } = await supabase
        .from('sh_price_negotiations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', negotiation.id);

      if (error) throw error;
      setNegotiation(prev => ({ ...prev, status: 'rejected' }));
      if (onCancelled) onCancelled();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-text-muted">Cargando negociación...</div>;
  if (error) return <div className="p-4 text-center text-error">{error}</div>;
  if (!negotiation) return null;

  const isClient = currentUserRole === 'client';
  const isTech = currentUserRole === 'technician';

  const getStatusLabel = () => {
    switch (negotiation.status) {
      case 'pending': return 'Pendiente';
      case 'client_offered': return isClient ? 'Tu oferta enviada' : 'Oferta del cliente recibida';
      case 'technician_countered': return isTech ? 'Tu contraoferta enviada' : 'Contraoferta del técnico';
      case 'accepted': return '✅ Acordado';
      case 'rejected': return '❌ Rechazado';
      case 'expired': return '⏰ Expirado';
      default: return negotiation.status;
    }
  };

  const canMakeOffer = isClient && ['pending', 'technician_countered'].includes(negotiation.status);
  const canCounterOffer = isTech && ['client_offered'].includes(negotiation.status);
  const canAccept = isTech && negotiation.status === 'client_offered';
  const canReject = isTech && ['client_offered', 'technician_countered'].includes(negotiation.status);

  return (
    <div className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-label-lg font-bold text-text-primary">Negociación de Precio</h3>
        <span className={`text-label-sm font-bold px-2 py-0.5 rounded-full ${
          negotiation.status === 'accepted' ? 'bg-emerald-safe-bg text-escrow-shield border border-secondary-container' :
           negotiation.status === 'rejected' ? 'bg-error/20 text-error border border-error/30' :
           negotiation.status === 'expired' ? 'bg-text-muted/20 text-text-muted border border-border-subtle' :
           'bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim'
        }`}>
          {getStatusLabel()}
        </span>
      </div>

      <div className="space-y-3 p-3 bg-surface-alt rounded-lg">
        <div className="flex justify-between text-body-sm">
          <span className="text-text-muted">Precio original</span>
          <span className="font-bold text-text-primary">{formatPrice(negotiation.original_price_mxn / 100)} MXN</span>
        </div>

        {negotiation.client_offer_mxn && (
          <div className="flex justify-between text-body-sm text-escrow-shield">
            <span>Oferta del cliente</span>
            <span className="font-bold">{formatPrice(negotiation.client_offer_mxn / 100)} MXN</span>
          </div>
        )}

        {negotiation.technician_offer_mxn && (
          <div className="flex justify-between text-body-sm text-primary">
            <span>Contraoferta técnico</span>
            <span className="font-bold">{formatPrice(negotiation.technician_offer_mxn / 100)} MXN</span>
          </div>
        )}

        {negotiation.agreed_price_mxn && (
          <div className="pt-2 border-t border-border-subtle flex justify-between text-headline-sm font-bold text-escrow-shield">
            <span>Precio acordado</span>
            <span>{formatPrice(negotiation.agreed_price_mxn / 100)} MXN</span>
          </div>
        )}
      </div>

      {(canMakeOffer || canCounterOffer) && (
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <label className="text-label-sm font-medium text-text-primary">
            {isClient ? 'Tu oferta (MXN)' : 'Tu contraoferta (MXN)'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej: 850"
              className="flex-1 px-3 py-2 border border-border-subtle rounded-lg text-body-md bg-surface-alt text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              min="100"
              max={negotiation.original_price_mxn / 100}
              disabled={submitting}
            />
            <button
              onClick={() => {
                const price = parseInt(inputValue) * 100;
                if (!isNaN(price) && price > 0) handleOffer(price);
              }}
              disabled={submitting || !inputValue || parseInt(inputValue) <= 0}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : isClient ? 'Enviar oferta' : 'Contraofertar'}
            </button>
          </div>
        </div>
      )}

      {canAccept && (
        <div className="flex gap-2 pt-2 border-t border-border-subtle">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 bg-escrow-shield text-white rounded-lg font-bold hover:bg-emerald-safe transition-colors"
          >
            Aceptar oferta de {formatPrice(negotiation.client_offer_mxn! / 100)} MXN
          </button>
        </div>
      )}

      {canReject && (
        <div className="flex gap-2 pt-2 border-t border-border-subtle">
          <button
            onClick={handleReject}
            className="flex-1 py-2 bg-error text-on-error rounded-lg font-bold hover:bg-error/90 transition-colors"
          >
            Rechazar
          </button>
        </div>
      )}

      {negotiation.status === 'accepted' && (
        <div className="text-center pt-2 text-body-sm text-escrow-shield font-medium">
          ✅ Precio acordado: {formatPrice(negotiation.agreed_price_mxn! / 100)} MXN
        </div>
      )}

      {negotiation.status === 'rejected' && (
        <div className="text-center pt-2 text-body-sm text-error">
          ❌ Negociación rechazada
        </div>
      )}

      {negotiation.status === 'expired' && (
        <div className="text-center pt-2 text-body-sm text-text-muted">
          ⏰ La negociación ha expirado
        </div>
      )}

      {error && (
        <div className="text-center text-sm text-error p-2 bg-error/10 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default PriceNegotiation;