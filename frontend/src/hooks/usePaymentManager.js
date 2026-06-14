import { useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useLatestValue } from '@/hooks/useLatestValue';
import { API } from '@/utils/translatorConstants';
import { isValidEmail } from '@/utils/translatorHelpers';

export const usePaymentManager = ({ setters, state }) => {
  const paymentEmailRef = useLatestValue(state.paymentEmail);
  const {
    setIsPremium,
    setIsProcessingPayment,
    setPaymentEmail,
    setPremiumEmail,
    setShowPaymentModal
  } = setters;

  const openPaymentModal = useCallback(() => {
    if (state.isPremium) {
      toast.success(`Premium active! (${state.premiumEmail})`);
      return;
    }

    setShowPaymentModal(true);
  }, [setShowPaymentModal, state.isPremium, state.premiumEmail]);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentEmail('');
  }, [setPaymentEmail, setShowPaymentModal]);

  const initiateCheckout = useCallback(async () => {
    const paymentEmail = paymentEmailRef.current;
    if (!isValidEmail(paymentEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const normalizedEmail = paymentEmail.toLowerCase();
      const response = await axios.post(`${API}/payments/create-checkout`, {
        origin_url: window.location.origin,
        email: normalizedEmail
      });

      localStorage.setItem('translator_email', normalizedEmail);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.');
      setIsProcessingPayment(false);
    }
  }, [paymentEmailRef, setIsProcessingPayment]);

  const checkPremiumByEmail = useCallback(async () => {
    const paymentEmail = paymentEmailRef.current;
    if (!isValidEmail(paymentEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const normalizedEmail = paymentEmail.toLowerCase();
      const response = await axios.post(`${API}/payments/check-premium`, {
        email: normalizedEmail
      });

      if (response.data.is_premium) {
        setIsPremium(true);
        setPremiumEmail(normalizedEmail);
        localStorage.setItem('translator_premium', 'true');
        localStorage.setItem('translator_email', normalizedEmail);
        setShowPaymentModal(false);
        toast.success('Premium restored! Welcome back.');
      } else {
        toast.info('No premium found for this email. You can purchase below.');
      }
    } catch (error) {
      toast.error('Could not verify. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [paymentEmailRef, setIsPremium, setIsProcessingPayment, setPremiumEmail, setShowPaymentModal]);

  return {
    checkPremiumByEmail,
    closePaymentModal,
    initiateCheckout,
    openPaymentModal
  };
};