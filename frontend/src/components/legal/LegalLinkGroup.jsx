import { Link } from 'react-router-dom';

export const LegalLinkGroup = () => (
  <div className="legal-link-group" data-testid="legal-link-group">
    <Link to="/privacy" data-testid="privacy-link">Privacy Policy</Link>
    <Link to="/terms" data-testid="terms-link">Terms of Service</Link>
  </div>
);