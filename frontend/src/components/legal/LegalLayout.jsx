import { Link } from 'react-router-dom';
import { LEGAL_BRAND_NAME, LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/legalContent';

export const LegalLayout = ({ children, description, title }) => (
  <div className="legal-page" data-testid="legal-page">
    <header className="legal-header">
      <Link to="/" className="legal-home-link" data-testid="legal-home-link">
        ← Back to translator
      </Link>
      <div className="legal-header-copy">
        <p className="legal-eyebrow">Legal</p>
        <h1 className="legal-title">{title}</h1>
        <p className="legal-description">{description}</p>
        <div className="legal-meta" data-testid="legal-page-meta">
          <span>{LEGAL_BRAND_NAME}</span>
          <span>Last updated: {LEGAL_LAST_UPDATED}</span>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </div>
      </div>
    </header>

    <main className="legal-body">{children}</main>
  </div>
);