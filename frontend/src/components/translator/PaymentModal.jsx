import { Check, Crown, Envelope, X } from '@phosphor-icons/react';
import { LegalLinkGroup } from '@/components/legal/LegalLinkGroup';

export const PaymentModal = ({
  isProcessingPayment,
  onCheckout,
  onClose,
  onEmailChange,
  onRestore,
  paymentEmail,
  show
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="conversation-overlay" data-testid="payment-modal-overlay">
      <div className="conversation-modal payment-modal" style={{ maxWidth: '400px' }}>
        <div className="conversation-header">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight">
            <Crown size={24} weight="fill" className="inline mr-2 text-yellow-500" />
            Unlock Premium
          </h2>
          <button
            data-testid="close-payment-modal-btn"
            className="swiss-btn p-2 border border-black"
            onClick={onClose}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="font-mono text-sm mb-4">Premium includes:</p>
            <ul className="space-y-2 text-sm" data-testid="premium-feature-list">
              <li className="flex items-center gap-2"><Check size={16} weight="bold" className="text-green-600" /><span>Offline translation mode</span></li>
              <li className="flex items-center gap-2"><Check size={16} weight="bold" className="text-green-600" /><span>250+ phrase phrasebook</span></li>
              <li className="flex items-center gap-2"><Check size={16} weight="bold" className="text-green-600" /><span>Ad-free experience</span></li>
              <li className="flex items-center gap-2"><Check size={16} weight="bold" className="text-green-600" /><span>One-time payment - $4.99</span></li>
            </ul>
          </div>

          <div className="mb-4">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-600 block mb-2">
              Your Email
            </label>
            <div className="relative">
              <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                data-testid="payment-email-input"
                type="email"
                value={paymentEmail}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="email@example.com"
                className="w-full border-2 border-black p-3 pl-10 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={isProcessingPayment}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Used to restore premium on other devices</p>
          </div>

          <button
            data-testid="checkout-btn"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-mono uppercase tracking-wider py-3 border-2 border-black mb-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            onClick={onCheckout}
            disabled={isProcessingPayment || !paymentEmail}
          >
            {isProcessingPayment ? <span>Processing...</span> : <><Crown size={18} weight="fill" />Purchase Premium - $4.99</>}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500 font-mono">or</span></div>
          </div>

          <button
            data-testid="restore-btn"
            className="w-full bg-white hover:bg-gray-100 text-black font-mono uppercase tracking-wider py-2 border-2 border-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            onClick={onRestore}
            disabled={isProcessingPayment || !paymentEmail}
          >
            Restore Previous Purchase
          </button>

          <div className="payment-legal-links" data-testid="payment-legal-links">
            <p className="text-[11px] text-gray-500 font-mono uppercase tracking-wide">By purchasing, you agree to the following:</p>
            <LegalLinkGroup />
          </div>
        </div>
      </div>
    </div>
  );
};