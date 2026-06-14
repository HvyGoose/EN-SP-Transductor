import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentCheckingView, PaymentFailedView, PaymentSuccessView } from '@/components/translator/PaymentStatusView';
import { usePaymentStatusChecker } from '@/components/translator/PaymentStatusChecker';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const status = usePaymentStatusChecker(sessionId);

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'checking' && <PaymentCheckingView />}
        {status === 'success' && <PaymentSuccessView onGoHome={goHome} />}
        {status === 'failed' && <PaymentFailedView onGoHome={goHome} />}
      </div>
    </div>
  );
}

export default PaymentSuccess;
