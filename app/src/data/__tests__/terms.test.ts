import fs from 'fs';
import path from 'path';
import { TERMS_SECTIONS, TERMS_VERSION, type LegalSection } from '../terms';
import { PRIVACY_SECTIONS, PRIVACY_VERSION } from '../privacy';

// docs/legal/*.md are the copies for legal review. They must match the app.
// Regenerate with: UPDATE_LEGAL=1 npx jest src/data/__tests__/terms.test.ts
const LEGAL = path.join(__dirname, '../../../../docs/legal');

function toMarkdown(title: string, source: string, version: string, sections: LegalSection[]): string {
  const lines = [
    `# GinMai ${title}`,
    '',
    `_Last updated ${version}. DRAFT: to be reviewed by a Thai lawyer before launch. Fill in the [bracketed] placeholders._`,
    '',
    `_Generated from \`app/src/data/${source}\`; edit that file, not this one._`,
    '',
  ];
  for (const section of sections) {
    lines.push(`## ${section.title}`, '');
    for (const p of section.body) lines.push(p, '');
  }
  return lines.join('\n');
}

const docs = [
  { file: 'terms.md', md: () => toMarkdown('Terms of Use', 'terms.ts', TERMS_VERSION, TERMS_SECTIONS) },
  { file: 'privacy.md', md: () => toMarkdown('Privacy Policy', 'privacy.ts', PRIVACY_VERSION, PRIVACY_SECTIONS) },
];

const text = (sections: LegalSection[]) => sections.map((s) => s.title + ' ' + s.body.join(' ')).join(' ');

describe('legal documents', () => {
  it.each(docs)('docs/legal/$file matches the app', ({ file, md }) => {
    const expected = md();
    if (process.env.UPDATE_LEGAL) fs.writeFileSync(path.join(LEGAL, file), expected);
    expect(fs.readFileSync(path.join(LEGAL, file), 'utf8')).toBe(expected);
  });

  it('terms cover what an app for meeting strangers needs', () => {
    for (const must of ['20 years', 'public places', 'report', 'block', 'delete your account', 'PDPA', 'Thailand']) {
      expect(text(TERMS_SECTIONS)).toContain(must);
    }
  });

  it('privacy policy names every data processor the app uses', () => {
    for (const must of ['Supabase', 'Twilio', 'Google', 'Expo', 'Apple', 'PDPC', '12 months', 'delete your account']) {
      expect(text(PRIVACY_SECTIONS)).toContain(must);
    }
  });

  it('terms and privacy policy agree on keeping reports for 12 months', () => {
    expect(text(TERMS_SECTIONS)).toContain('12 months');
  });
});
