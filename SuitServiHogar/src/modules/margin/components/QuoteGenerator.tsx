import React from 'react';
import { formatPrice } from '../../../lib/constants';

export interface Quote {
  publicId: string;
  createdAt: string;
  business: { name: string; phone: string; email: string };
  customer: { name: string; phone: string };
  jobTitle: string;
  jobDescription: string;
  scope: { included: string[]; exclusions: string[]; assumptions: string[] };
  materials: { name: string; costMxn: number }[];
  priceMxn: number;
  timelineDays: number;
  expiresInDays: number;
}

const HASH_PREFIX = '#margin-quote=';

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function buildShareUrl(q: Quote): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${HASH_PREFIX}${toB64Url(JSON.stringify(q))}`;
}

export function readSharedQuote(hash: string): Quote | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    const q = JSON.parse(fromB64Url(hash.slice(HASH_PREFIX.length)));
    return q && typeof q === 'object' && q.jobTitle && typeof q.priceMxn === 'number' ? q : null;
  } catch {
    return null;
  }
}

export const newQuoteId = () =>
  'Q-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString().slice(-4);

interface QuoteGeneratorProps {
  quote: Quote;
  onShare?: (url: string) => void;
  onBack?: () => void;
}

/** PRD #16/#17 — vista web imprimible (print → PDF) + enlace público. Sin pagos en MVP. */
export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ quote, onShare, onBack }) => {
  const expires = new Date(new Date(quote.createdAt).getTime() + quote.expiresInDays * 86400000);

  const copyLink = async () => {
    const url = buildShareUrl(quote);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copia el enlace público:', url);
    }
    onShare?.(url);
  };

  const section = (title: string, items: string[]) =>
    items.length > 0 && (
      <div>
        <h4 className="text-label-md font-bold text-text-primary mb-1">{title}</h4>
        <ul className="list-disc pl-5 space-y-0.5 text-body-sm text-text-secondary">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
    );

  return (
    <div className="space-y-4">
      {onBack && (
        <button onClick={onBack} className="print:hidden flex items-center gap-1 text-label-md text-primary font-bold">
          <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span> Volver
        </button>
      )}

      <article className="quote-sheet bg-surface-card rounded-2xl border border-border-subtle p-5 space-y-4">
        <header className="flex justify-between items-start border-b border-border-subtle pb-3">
          <div>
            <p className="text-headline-sm font-bold text-text-primary">{quote.business.name}</p>
            <p className="text-body-sm text-text-muted">{quote.business.phone} · {quote.business.email}</p>
          </div>
          <div className="text-right">
            <p className="text-label-lg font-bold text-primary">{quote.publicId}</p>
            <p className="text-body-sm text-text-muted">{new Date(quote.createdAt).toLocaleDateString('es-MX')}</p>
          </div>
        </header>

        <section>
          <p className="text-label-sm uppercase tracking-wide text-text-muted">Cliente</p>
          <p className="text-body-md font-semibold text-text-primary">{quote.customer.name}</p>
          <p className="text-body-sm text-text-muted">{quote.customer.phone}</p>
        </section>

        <section>
          <p className="text-label-sm uppercase tracking-wide text-text-muted">Trabajo</p>
          <p className="text-body-md font-semibold text-text-primary">{quote.jobTitle}</p>
          <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{quote.jobDescription}</p>
        </section>

        <section className="space-y-3">
          {section('Trabajo incluido', quote.scope.included)}
          {section('Materiales incluidos', quote.materials.map((m) => `${m.name} — ${formatPrice(m.costMxn)}`))}
          {section('Exclusiones', quote.scope.exclusions)}
          {section('Supuestos', quote.scope.assumptions)}
        </section>

        <section className="rounded-xl bg-surface-alt p-4 flex justify-between items-center border border-border-subtle">
          <div>
            <p className="text-label-sm text-text-muted">Total (MXN)</p>
            <p className="text-headline-sm font-bold text-text-primary">{formatPrice(quote.priceMxn)}</p>
          </div>
          <div className="text-right">
            <p className="text-label-sm text-text-muted">Tiempo estimado</p>
            <p className="text-body-md font-semibold text-text-primary">{quote.timelineDays} días</p>
          </div>
        </section>

        <footer className="text-body-sm text-text-muted space-y-1 border-t border-border-subtle pt-3">
          <p><strong>Vigencia:</strong> hasta {expires.toLocaleDateString('es-MX')}</p>
          <p>
            El cliente acepta el alcance y el precio descritos. Cambios de alcance requieren nueva
            cotización. Esta cotización no constituye una factura.
          </p>
        </footer>
      </article>

      <div className="print:hidden flex gap-2">
        <button
          onClick={() => window.print()}
          className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
        </button>
        <button
          onClick={copyLink}
          className="flex-1 h-11 bg-trust-blue-light text-primary rounded-xl text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">link</span> Enlace público
        </button>
      </div>
    </div>
  );
};
