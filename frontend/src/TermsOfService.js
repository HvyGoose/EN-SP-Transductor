import { LegalLayout } from '@/components/legal/LegalLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import {
  LEGAL_BRAND_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  LEGAL_PREMIUM_PRICE,
  termsHighlights
} from '@/legalContent';

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      description={`These terms describe how ${LEGAL_BRAND_NAME} may be used, how premium access works, and how refunds and support are handled.`}
    >
      <LegalSection title="Using the service">
        <p>By using this app, you agree to use it lawfully and responsibly. The service is intended as a practical English/Spanish translation tool, but translations may not always be perfect or suitable for critical decisions.</p>
      </LegalSection>

      <LegalSection title="Key terms at a glance">
        <ul>
          {termsHighlights.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </LegalSection>

      <LegalSection title="Premium purchases and refunds">
        <p>Premium is currently offered as a one-time payment of {LEGAL_PREMIUM_PRICE}. Refund requests are reviewed case by case. If you need help with a purchase, email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> with the email used for checkout and a short description of the issue.</p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>We may update, improve, suspend, or discontinue features at any time. We may also update these terms from time to time, with the latest version posted here.</p>
      </LegalSection>

      <LegalSection title="Limitation of liability and governing law">
        <p>The service is provided on an “as is” basis to the maximum extent permitted by law. To the extent allowed, disputes and interpretation of these terms will be governed by the laws of {LEGAL_JURISDICTION}.</p>
      </LegalSection>
    </LegalLayout>
  );
}