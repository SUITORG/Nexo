import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const FeedbackWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('sh_feedback').insert({
      user_id: user?.id ?? null,
      message: message.trim(),
      screen: window.location.hash || '/',
    });
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setMessage(''); }, 1500);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {open && (
        <div className="bg-surface-card border border-border-subtle shadow-elevated rounded-xl p-4 w-72 mb-2 space-y-3">
          {sent ? (
            <div className="text-center py-4 space-y-2">
              <span className="material-symbols-outlined text-3xl text-escrow-shield">check_circle</span>
              <p className="text-label-md text-text-primary font-bold">¡Gracias!</p>
              <p className="text-body-sm text-text-muted">Tu opinión nos ayuda a mejorar.</p>
            </div>
          ) : (
            <>
              <p className="text-label-md text-text-primary font-bold">¿Cómo te fue?</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cuéntanos tu experiencia..."
                className="w-full h-20 bg-surface-alt border border-border-subtle rounded-lg p-2 text-body-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 py-2 text-label-sm text-text-muted hover:text-text-primary">Cancelar</button>
                <button onClick={handleSend} className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:bg-trust-blue-dark transition-colors">Enviar</button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-primary hover:bg-trust-blue-dark text-on-primary rounded-full shadow-elevated flex items-center justify-center transition-transform active:scale-95"
        title="Feedback"
      >
        <span className="material-symbols-outlined text-[22px]">{open ? 'close' : 'feedback'}</span>
      </button>
    </div>
  );
};
