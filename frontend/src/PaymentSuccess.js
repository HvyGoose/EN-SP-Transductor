import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, X } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Constants
const HTTP_NOT_FOUND = 404;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;
const MAX_ERROR_RETRIES = 5;

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get('session_id');

  // Check payment status callback
  const checkPaymentStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        localStorage.setItem('translator_premium', 'true');
        localStorage.setItem('translator_session_id', sessionId);
      } else if (response.data.status === 'expired') {
        setStatus('failed');
      } else if (attempts < MAX_POLL_ATTEMPTS) {
        setTimeout(() => setAttempts(a => a + 1), POLL_INTERVAL_MS);
      } else {
        setStatus('failed');
      }
    } catch (err) {
      if (err.response && err.response.status === HTTP_NOT_FOUND) {
        setStatus('failed');
        return;
      }
      if (attempts < MAX_ERROR_RETRIES) {
        setTimeout(() => setAttempts(a => a + 1), POLL_INTERVAL_MS);
      } else {
        setStatus('failed');
      }
    }
  }, [sessionId, attempts]);

  // Poll payment status
  useEffect(() => {
    checkPaymentStatus();
  }, [checkPaymentStatus]);

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'checking' && (
          <>
            <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">
              Processing Payment
            </h1>
            <p className="text-gray-600 font-mono text-sm">
              Please wait while we confirm your payment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500 text-white flex items-center justify-center mx-auto mb-6">
              <Check size={48} weight="bold" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 font-mono text-sm mb-6">
              Welcome to Premium! You now have access to offline mode and an ad-free experience.
            </p>
            <button
              onClick={goHome}
              className="bg-black text-white px-6 py-3 font-mono uppercase tracking-wider hover:bg-gray-800 transition"
            >
              Start Translating
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-500 text-white flex items-center justify-center mx-auto mb-6">
              <X size={48} weight="bold" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600 font-mono text-sm mb-6">
              Something went wrong with your payment. Please try again.
            </p>
            <button
              onClick={goHome}
              className="bg-black text-white px-6 py-3 font-mono uppercase tracking-wider hover:bg-gray-800 transition"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
