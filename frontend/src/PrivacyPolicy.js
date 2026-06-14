import { LegalLayout } from '@/components/legal/LegalLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import {
  LEGAL_BRAND_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  privacyHighlights
} from '@/legalContent';

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description={`${LEGAL_BRAND_NAME} explains here what information we collect, how we use it, and how to contact us about privacy requests.`}
    >
      <LegalSection title="What we collect">
        <ul>
          {privacyHighlights.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>We use submitted text and audio to generate translations, transcriptions, and speech playback. We may also store translation history and premium status to support app functionality and purchase restoration.</p>
      </LegalSection>

      <LegalSection title="Payments and premium">
        <p>Premium purchases are processed through Stripe. Stripe may collect and process payment details directly under its own privacy terms. We store limited purchase-related data such as email, session identifiers, and premium activation status.</p>
      </LegalSection>

      <LegalSection title="Data retention and deletion">
        <p>We retain operational data only as reasonably necessary to provide the service, maintain history features, investigate support issues, and handle refund or fraud review needs. To request deletion or privacy assistance, email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.</p>
      </LegalSection>

      <LegalSection title="Jurisdiction and contact">
        <p>This service is operated from {LEGAL_JURISDICTION}. Privacy questions, access requests, and deletion requests should be sent to <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalLayout>
  );
}