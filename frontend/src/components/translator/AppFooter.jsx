import { LegalLinkGroup } from '@/components/legal/LegalLinkGroup';
import { LEGAL_BRAND_NAME, LEGAL_CONTACT_EMAIL } from '@/legalContent';

export const AppFooter = () => (
  <footer className="app-footer" data-testid="app-footer">
    <div className="app-footer-copy">
      <p className="app-footer-title">{LEGAL_BRAND_NAME}</p>
      <p className="app-footer-text">
        Translation, premium access, refunds, and privacy requests can be directed to{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} data-testid="legal-contact-email-link">
          {LEGAL_CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
    <LegalLinkGroup />
  </footer>
);