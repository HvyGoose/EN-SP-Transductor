import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/utils/translatorConstants';
import {
  MAX_ERROR_RETRIES,
  MAX_POLL_ATTEMPTS,
  PAYMENT_STATUS_NOT_FOUND,
  POLL_INTERVAL_MS
} from '@/components/translator/paymentSuccessConstants';

const pollAgain = (setAttempts) => setTimeout(() => setAttempts((current) => current + 1), POLL_INTERVAL_MS);

export const usePaymentStatusChecker = (sessionId) => {
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

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
        return;
      }

      if (response.data.status === 'expired' || attempts >= MAX_POLL_ATTEMPTS) {
        setStatus('failed');
        return;
      }

      pollAgain(setAttempts);
    } catch (error) {
      if (error.response?.status === PAYMENT_STATUS_NOT_FOUND || attempts >= MAX_ERROR_RETRIES) {
        setStatus('failed');
        return;
      }

      pollAgain(setAttempts);
    }
  }, [attempts, sessionId]);

  useEffect(() => {
    checkPaymentStatus();
  }, [checkPaymentStatus]);

  return status;
};