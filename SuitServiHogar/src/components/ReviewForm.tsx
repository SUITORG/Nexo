import React, { useState } from 'react';
import { submitReview, containsBannedWords } from '../services/reviewService';

interface ReviewFormProps {
  orderId: string;
  revieweeId: string;
  reviewerId: string;
  reviewerRole: 'client' | 'technician';
  revieweeName: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  revieweeId,
  reviewerId,
  reviewerRole,
  revieweeName,
  onSubmitSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const starLabels = ['Malo', 'Regular', 'Bueno', 'Muy Bueno', 'Excelente'];

  const handleSubmit = async () => {
    setError('');
    if (rating === 0) {
      setError('Selecciona al menos 1 estrella');
      return;
    }
    if (comment && containsBannedWords(comment)) {
      setError('Tu comentario contiene palabras no permitidas. Modifícalo para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(orderId, reviewerId, revieweeId, reviewerRole, rating, comment || undefined);
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al enviar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 space-y-4">
      <div>
        <h3 className="text-headline-sm font-bold text-text-primary">
          Calificar a {reviewerRole === 'client' ? 'técnico' : 'cliente'}
        </h3>
        <p className="text-body-sm text-text-muted mt-1">
          {reviewerRole === 'client'
            ? `¿Cómo fue tu experiencia con ${revieweeName}?`
            : `¿Cómo fue tu experiencia trabajando con ${revieweeName}?`}
        </p>
      </div>

      {/* Estrellas */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="active:scale-110 transition-transform"
          >
            <span
              className={`material-symbols-outlined text-[36px] ${
                star <= rating
                  ? 'material-symbols-fill text-amber-dark'
                  : 'text-text-muted/30'
              }`}
            >
              star
            </span>
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-body-sm font-bold text-amber-dark -mt-2">
          {starLabels[rating - 1]}
        </p>
      )}

      {/* Comentario */}
      <div>
        <label className="text-label-sm font-bold text-text-primary block mb-1">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuenta tu experiencia..."
          maxLength={300}
          rows={3}
          className="w-full bg-surface-alt rounded-xl px-4 py-2.5 text-body-sm text-text-primary placeholder:text-text-muted border border-border-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <p className="text-[10px] text-text-muted mt-1 text-right">{comment.length}/300</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
          <p className="text-body-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 bg-surface-alt hover:bg-surface-container text-text-muted hover:text-text-primary rounded-xl font-label-md font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex-1 py-2.5 px-4 bg-primary hover:bg-trust-blue-dark text-white rounded-xl font-label-md font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40"
        >
          {submitting ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">send</span>
          )}
          <span>{submitting ? 'Enviando...' : 'Enviar Reseña'}</span>
        </button>
      </div>
    </div>
  );
};
