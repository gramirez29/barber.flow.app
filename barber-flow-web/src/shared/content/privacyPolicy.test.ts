import { describe, expect, it } from 'vitest';
import {
  PRIVACY_POLICY_CONTACT_EMAIL,
  PRIVACY_POLICY_HERO,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PolicyBlock,
  PolicyLang,
  splitBold,
} from './privacyPolicy';

const LANGS: PolicyLang[] = ['en', 'es'];

const textOf = (block: PolicyBlock, lang: PolicyLang): string[] => {
  switch (block.type) {
    case 'paragraph':
    case 'callout':
      return [block.text[lang]];
    case 'list':
      return block.items[lang];
    case 'table':
      return [...block.headers[lang], ...block.rows[lang].flat()];
  }
};

const allText = (lang: PolicyLang) =>
  [
    PRIVACY_POLICY_INTRO[lang],
    ...PRIVACY_POLICY_SECTIONS.flatMap((section) => [section.title[lang], ...section.blocks.flatMap((block) => textOf(block, lang))]),
  ].join('\n');

describe('privacy policy content', () => {
  it('tiene 9 secciones con ids únicos', () => {
    const ids = PRIVACY_POLICY_SECTIONS.map((section) => section.id);
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
  });

  it('cada sección y bloque está completo en inglés y en español', () => {
    for (const section of PRIVACY_POLICY_SECTIONS) {
      for (const lang of LANGS) {
        expect(section.title[lang].trim().length).toBeGreaterThan(0);
        for (const block of section.blocks) {
          for (const text of textOf(block, lang)) expect(text.trim().length).toBeGreaterThan(0);
        }
      }

      for (const block of section.blocks) {
        if (block.type === 'list') expect(block.items.en).toHaveLength(block.items.es.length);
        if (block.type === 'table') {
          expect(block.rows.en).toHaveLength(block.rows.es.length);
          expect(block.headers.en).toHaveLength(block.headers.es.length);
          for (const lang of LANGS) {
            for (const row of block.rows[lang]) expect(row).toHaveLength(block.headers[lang].length);
          }
        }
      }
    }
  });

  it('usa el nombre HairCutsFlow CR y no menciona la marca ni el correo anteriores', () => {
    for (const lang of LANGS) {
      const text = allText(lang) + PRIVACY_POLICY_HERO.subtitle[lang];
      expect(text).toContain('HairCutsFlow CR');
      expect(text).not.toContain('Barber Flow');
      expect(text).not.toContain('barberflow.app');
    }
  });

  it('nombra a los cuatro proveedores de servicio en ambos idiomas', () => {
    for (const lang of LANGS) {
      const text = allText(lang);
      for (const provider of ['Railway', 'MongoDB Atlas', 'Resend', 'Cloudflare']) {
        expect(text).toContain(provider);
      }
    }
  });

  it('identifica al responsable y el correo de contacto', () => {
    expect(PRIVACY_POLICY_CONTACT_EMAIL).toBe('barber.flow.cr@gmail.com');
    for (const lang of LANGS) expect(allText(lang)).toContain('Guillermo Ramirez');
  });
});

describe('splitBold', () => {
  it('separa los segmentos en negrita', () => {
    expect(splitBold('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });

  it('devuelve un solo segmento sin marcas', () => {
    expect(splitBold('sin negrita')).toEqual([{ text: 'sin negrita', bold: false }]);
  });
});
