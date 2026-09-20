import React, { useEffect, useState, useRef } from 'react';
import { Message, fetchMessages, sendMessage, uploadChatPhoto, subscribeToMessages } from '../../services/messageService';
import { supabase } from '../../lib/supabase';
import { PriceNegotiation } from '../PriceNegotiation';
import { formatPrice } from '../../lib/constants';

interface ChatScreenProps {
  orderId: string;
  orderIdShort: string;
  counterpartName: string;
  userRole: 'client' | 'technician';
  userId: string;
  onBack: () => void;
  orderTotalMxn?: number; // Precio total en centavos
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  orderId,
  orderIdShort,
  counterpartName,
  userRole,
  userId,
  onBack,
  orderTotalMxn
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const unsub = subscribeToMessages(orderId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsub;
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await fetchMessages(orderId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(orderId, userId, userRole, text);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadChatPhoto(file, orderId);
      await sendMessage(orderId, userId, userRole, 'Foto adjunta', url);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="shrink-0 bg-surface-card border-b border-border-subtle p-3 flex items-center gap-3">
        <button onClick={onBack} className="text-text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-label-md font-bold text-text-primary truncate">{counterpartName}</p>
          <p className="text-[11px] text-text-muted">Orden #{orderIdShort}</p>
        </div>
        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
      </div>

      {/* Price Negotiation */}
      {orderTotalMxn && (
        <PriceNegotiation
          orderId={orderId}
          currentUserRole={userRole}
          currentPriceMxn={orderTotalMxn}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-alt">
        {messages.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">chat</span>
            <p className="text-body-sm">Inicia la conversación con {counterpartName}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_role === userRole;
          const isSystem = msg.sender_role === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[11px] text-text-muted bg-surface-card px-3 py-1 rounded-full border border-border-subtle">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                isMine
                  ? 'bg-primary text-on-primary rounded-br-sm'
                  : 'bg-surface-card text-text-primary border border-border-subtle rounded-bl-sm'
              }`}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="Foto" className="rounded-lg mb-1.5 max-h-48 object-cover" />
                )}
                <p className="text-body-sm leading-snug">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${isMine ? 'text-on-primary/60' : 'text-text-muted'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-surface-card border-t border-border-subtle p-3">
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center border border-border-subtle active:scale-95 transition-transform disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">
              {uploading ? 'hourglass_top' : 'photo_camera'}
            </span>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-surface-alt rounded-full px-4 py-2.5 text-body-sm text-text-primary placeholder:text-text-muted border border-border-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-on-primary text-[20px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
