import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ponytail: caché en módulo — una query por sesión, default OFF (oculto)
let cached: boolean | null = null;
let pending: Promise<void> | null = null;

function load(): Promise<void> {
  if (!pending) {
    pending = Promise.resolve(
      supabase
        .from('sh_config')
        .select('value')
        .eq('key', 'show_tax_info')
        .maybeSingle()
    )
      .then(({ data }) => {
        const v = data ? data.value : false;
        cached = v === true || v === 'true';
      })
      .catch(() => {
        cached = false; // tabla inexistente/RLS → oculto
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useTaxInfo(): boolean {
  const [show, setShow] = useState(cached ?? false);

  useEffect(() => {
    if (cached !== null) {
      setShow(cached);
      return;
    }
    load().then(() => setShow(cached ?? false));
  }, []);

  return show;
}
