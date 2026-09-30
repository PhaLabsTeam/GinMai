import fs from 'fs';
import path from 'path';
import { TERMS_SECTIONS, TERMS_VERSION } from '../terms';

// docs/legal/terms.md is the copy for legal review. It must match the app.
// Regenerate with: UPDATE_TERMS=1 npx jest src/data/__tests__/terms.test.ts
const DOC = path.join(__dirname, '../../../../docs/legal/terms.md');

function toMarkdown(): string {
  const lines = [
    '# GinMai Terms of Use',
    '',
    `_Last updated ${TERMS_VERSION}. DRAFT: to be reviewed by a Thai lawyer before launch. Fill in the [bracketed] placeholders._`,
    '',
    '_Generated from `app/src/data/terms.ts`; edit that file, not this one._',
    '',
  ];
  for (const section of TERMS_SECTIONS) {
    lines.push(`## ${section.title}`, '');
    for (const p of section.body) lines.push(p, '');
  }
  return lines.join('\n');
}

describe('terms', () => {
  it('docs/legal/terms.md matches the in-app terms', () => {
    const expected = toMarkdown();
    if (process.env.UPDATE_TERMS) fs.writeFileSync(DOC, expected);
    expect(fs.readFileSync(DOC, 'utf8')).toBe(expected);
  });

  it('covers what an app for meeting strangers needs', () => {
    const text = TERMS_SECTIONS.map((s) => s.title + ' ' + s.body.join(' ')).join(' ');
    for (const must of ['20 years', 'public places', 'report', 'block', 'delete your account', 'PDPA', 'Thailand']) {
      expect(text).toContain(must);
    }
  });
});
