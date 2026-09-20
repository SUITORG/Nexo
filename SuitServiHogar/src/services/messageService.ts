import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: 'client' | 'technician' | 'system';
  content: string;
  image_url?: string;
  created_at: string;
}

export async function fetchMessages(orderId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('sh_messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  orderId: string,
  senderId: string,
  senderRole: 'client' | 'technician',
  content: string,
  imageUrl?: string
): Promise<Message> {
  const id = `MSG-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await supabase
    .from('sh_messages')
    .insert({
      id,
      order_id: orderId,
      sender_id: senderId,
      sender_role: senderRole,
      content,
      image_url: imageUrl ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export async function uploadChatPhoto(file: File, orderId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `chat/${orderId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('sh-chat-photos')
    .upload(path, file, { contentType: file.type });

  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from('sh-chat-photos')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export function subscribeToMessages(
  orderId: string,
  callback: (msg: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${orderId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sh_messages', filter: `order_id=eq.${orderId}` },
      (payload) => callback(payload.new as Message)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
