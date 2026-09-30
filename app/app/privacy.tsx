import { LegalDocument } from "../src/components/LegalDocument";
import { PRIVACY_SECTIONS, PRIVACY_VERSION } from "../src/data/privacy";

export default function PrivacyScreen() {
  return <LegalDocument title="Privacy Policy" version={PRIVACY_VERSION} sections={PRIVACY_SECTIONS} />;
}
