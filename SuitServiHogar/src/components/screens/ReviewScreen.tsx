import React from 'react';
import { ReviewForm } from '../ReviewForm';

interface ReviewScreenProps {
  orderId: string;
  revieweeId: string;
  reviewerId: string;
  reviewerRole: 'client' | 'technician';
  revieweeName: string;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  orderId,
  revieweeId,
  reviewerId,
  reviewerRole,
  revieweeName,
  onBack
}) => {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span className="text-label-sm font-bold">Volver</span>
      </button>

      <ReviewForm
        orderId={orderId}
        revieweeId={revieweeId}
        reviewerId={reviewerId}
        reviewerRole={reviewerRole}
        revieweeName={revieweeName}
        onSubmitSuccess={() => onBack()}
        onCancel={onBack}
      />
    </div>
  );
};
