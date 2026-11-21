import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { appColors } from '@presentation/theme/appColors';
import {
  PRIVACY_POLICY_BRAND,
  PRIVACY_POLICY_CONTACT_EMAIL,
  PRIVACY_POLICY_FOOTER,
  PRIVACY_POLICY_HERO,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PolicyBlock,
  PolicyLang,
  splitBold,
} from '@shared/content/privacyPolicy';

const LANG_STORAGE_KEY = 'bf-lang';

const getInitialLang = (): PolicyLang => {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.); se usa el idioma del navegador.
  }
  const browserLang = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : undefined;
  return browserLang?.startsWith('en') ? 'en' : 'es';
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {splitBold(text).map((segment, index) =>
      segment.bold ? (
        <Box component="strong" key={index} sx={{ color: appColors.textPrimary }}>
          {segment.text}
        </Box>
      ) : (
        <React.Fragment key={index}>{segment.text}</React.Fragment>
      )
    )}
  </>
);

const bodyTextSx = { fontSize: 15, lineHeight: '24px', color: appColors.textSecondary };

const BlockView: React.FC<{ block: PolicyBlock; lang: PolicyLang }> = ({ block, lang }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <Typography sx={bodyTextSx}>
          <FormattedText text={block.text[lang]} />
        </Typography>
      );
    case 'list':
      return (
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {block.items[lang].map((item, index) => (
            <Box component="li" key={index} sx={{ ...bodyTextSx, '&::marker': { color: appColors.accent } }}>
              <FormattedText text={item} />
            </Box>
          ))}
        </Box>
      );
    case 'callout':
      return (
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 2,
            borderRadius: '14px',
            border: `1px solid ${appColors.border}`,
            backgroundColor: appColors.surfaceElevated,
          }}
        >
          <Box component="span" aria-hidden sx={{ fontSize: 20, lineHeight: '24px' }}>
            {block.icon}
          </Box>
          <Typography sx={bodyTextSx}>
            <FormattedText text={block.text[lang]} />
          </Typography>
        </Box>
      );
    case 'table':
      return (
        <Box sx={{ overflowX: 'auto', borderRadius: '14px', border: `1px solid ${appColors.border}` }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <Box component="thead">
              <Box component="tr">
                {block.headers[lang].map((header) => (
                  <Box
                    component="th"
                    key={header}
                    sx={{
                      textAlign: 'left',
                      p: 1.25,
                      fontSize: 12,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      color: appColors.accent,
                      backgroundColor: appColors.surfaceElevated,
                      borderBottom: `1px solid ${appColors.border}`,
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {block.rows[lang].map((row, rowIndex) => (
                <Box component="tr" key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <Box
                      component="td"
                      key={cellIndex}
                      sx={{
                        p: 1.25,
                        fontSize: 14,
                        verticalAlign: 'top',
                        color: cellIndex === 0 ? appColors.textPrimary : appColors.textSecondary,
                        fontWeight: cellIndex === 0 ? 600 : 400,
                        borderBottom: rowIndex === block.rows[lang].length - 1 ? 'none' : `1px solid ${appColors.border}`,
                      }}
                    >
                      {cell}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      );
  }
};

/**
 * Política de privacidad pública (sin login, sin layout de la app). Es la URL oficial que enlazan
 * mobile y la propia web: https://www.haircutsflowcr.com/privacy-policy
 */
export const PrivacyPolicyPage: React.FC = () => {
  const [lang, setLang] = useState<PolicyLang>(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${PRIVACY_POLICY_HERO.title[lang]} — ${PRIVACY_POLICY_BRAND}`;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Sin persistencia el idioma simplemente se vuelve a deducir en la próxima visita.
    }
  }, [lang]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: appColors.background, color: appColors.textPrimary }}>
      <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: appColors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ContentCutIcon sx={{ fontSize: 20, color: appColors.onAccent }} />
            </Box>
            <Typography sx={{ fontWeight: 800, letterSpacing: '1px', fontSize: 15 }}>
              {PRIVACY_POLICY_BRAND.toUpperCase()}
            </Typography>
          </Box>

          <Box role="group" aria-label="Language" sx={{ display: 'flex', gap: 0.75 }}>
            {(['en', 'es'] as const).map((option) => (
              <Box
                component="button"
                key={option}
                type="button"
                aria-pressed={lang === option}
                onClick={() => setLang(option)}
                sx={{
                  cursor: 'pointer',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '999px',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  border: `1px solid ${lang === option ? appColors.accent : appColors.border}`,
                  backgroundColor: lang === option ? appColors.accent : 'transparent',
                  color: lang === option ? appColors.onAccent : appColors.textSecondary,
                }}
              >
                {option}
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '20px',
            border: `1px solid ${appColors.border}`,
            backgroundColor: appColors.surface,
            mb: 3,
          }}
        >
          <Typography
            sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: appColors.accent }}
          >
            {PRIVACY_POLICY_HERO.eyebrow[lang]}
          </Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 700, mt: 0.5 }}>
            {PRIVACY_POLICY_HERO.title[lang]}
          </Typography>
          <Typography sx={{ ...bodyTextSx, mt: 0.75 }}>{PRIVACY_POLICY_HERO.subtitle[lang]}</Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 1.5 }}>
            {PRIVACY_POLICY_HERO.lastUpdated[lang]}
          </Typography>
        </Box>

        <Box
          component="nav"
          aria-label={PRIVACY_POLICY_HERO.contents[lang]}
          sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${appColors.border}`, backgroundColor: appColors.surface, mb: 3 }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: appColors.accent, mb: 1 }}>
            {PRIVACY_POLICY_HERO.contents[lang]}
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {PRIVACY_POLICY_SECTIONS.map((section) => (
              <Box component="li" key={section.id} sx={{ '&::marker': { color: appColors.accent } }}>
                <Box
                  component="a"
                  href={`#${section.id}`}
                  sx={{ color: appColors.textSecondary, fontSize: 14, textDecoration: 'none', '&:hover': { color: appColors.accent } }}
                >
                  {section.title[lang]}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '14px',
            border: `1px solid ${appColors.border}`,
            backgroundColor: appColors.surfaceElevated,
          }}
        >
          <Typography sx={bodyTextSx}>
            <FormattedText text={PRIVACY_POLICY_INTRO[lang]} />
          </Typography>
        </Box>

        <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PRIVACY_POLICY_SECTIONS.map((section, index) => (
            <Box component="section" id={section.id} key={section.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, scrollMarginTop: 16 }}>
              <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700 }}>
                <Box component="span" sx={{ color: appColors.accent, mr: 1.25, fontSize: 13, letterSpacing: '1px' }}>
                  {String(index + 1).padStart(2, '0')}
                </Box>
                {section.title[lang]}
              </Typography>
              {section.blocks.map((block, blockIndex) => (
                <BlockView block={block} lang={lang} key={blockIndex} />
              ))}

              {section.id === 's9' && (
                <Box
                  component="a"
                  href={`mailto:${PRIVACY_POLICY_CONTACT_EMAIL}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    alignSelf: 'flex-start',
                    px: 2,
                    py: 1.25,
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    color: appColors.onAccent,
                    backgroundColor: appColors.accent,
                    '&:hover': { backgroundColor: appColors.accentLight },
                  }}
                >
                  <MailOutlineIcon sx={{ fontSize: 20 }} />
                  {PRIVACY_POLICY_CONTACT_EMAIL}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Typography sx={{ fontSize: 12, color: appColors.textSecondary, textAlign: 'center', mt: 5 }}>
          {PRIVACY_POLICY_FOOTER[lang]}
        </Typography>
      </Box>
    </Box>
  );
};
