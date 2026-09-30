import { LegalDocument } from "../src/components/LegalDocument";
import { TERMS_SECTIONS, TERMS_VERSION } from "../src/data/terms";

// Terms of Use, readable before signing up (#17)
export default function TermsScreen() {
  return <LegalDocument title="Terms of Use" version={TERMS_VERSION} sections={TERMS_SECTIONS} />;
}
