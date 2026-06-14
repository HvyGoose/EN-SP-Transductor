import { Check, X } from '@phosphor-icons/react';

export const PaymentCheckingView = () => (
  <>
    <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
    <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Processing Payment</h1>
    <p className="text-gray-600 font-mono text-sm">Please wait while we confirm your payment...</p>
  </>
);

export const PaymentSuccessView = ({ onGoHome }) => (
  <>
    <div className="w-20 h-20 bg-green-500 text-white flex items-center justify-center mx-auto mb-6"><Check size={48} weight="bold" /></div>
    <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Payment Successful!</h1>
    <p className="text-gray-600 font-mono text-sm mb-6">Welcome to Premium! You now have access to offline mode and an ad-free experience.</p>
    <button data-testid="payment-success-home-btn" onClick={onGoHome} className="bg-black text-white px-6 py-3 font-mono uppercase tracking-wider hover:bg-gray-800 transition">
      Start Translating
    </button>
  </>
);

export const PaymentFailedView = ({ onGoHome }) => (
  <>
    <div className="w-20 h-20 bg-red-500 text-white flex items-center justify-center mx-auto mb-6"><X size={48} weight="bold" /></div>
    <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Payment Failed</h1>
    <p className="text-gray-600 font-mono text-sm mb-6">Something went wrong with your payment. Please try again.</p>
    <button data-testid="payment-failed-home-btn" onClick={onGoHome} className="bg-black text-white px-6 py-3 font-mono uppercase tracking-wider hover:bg-gray-800 transition">
      Go Back
    </button>
  </>
);