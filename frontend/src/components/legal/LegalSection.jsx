export const LegalSection = ({ children, title }) => (
  <section className="legal-section" data-testid="legal-section">
    <h2 className="legal-section-title">{title}</h2>
    <div className="legal-section-content">{children}</div>
  </section>
);