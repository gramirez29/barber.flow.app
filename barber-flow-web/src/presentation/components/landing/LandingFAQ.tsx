import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { appColors } from '@presentation/theme/appColors';

const FAQS = [
  {
    question: '¿Puedo usar HairCutsFlow desde el celular?',
    answer:
      'Sí, la app funciona completa desde el navegador de tu celular o tablet, sin necesidad de instalar nada.',
  },
  {
    question: '¿Cómo veo cuánto gané en el día?',
    answer:
      'En Reportes tenés el cierre diario: ingresos brutos, tu comisión y la ganancia neta, calculados automáticamente a partir de las citas completadas.',
  },
  {
    question: '¿Otros barberos pueden ver mis citas o clientes?',
    answer:
      'No. Cada barbero solo ve sus propias citas, clientes y reportes — la información es privada por barbero, no compartida en toda la barbería.',
  },
  {
    question: '¿Cómo recibo notificaciones de mis citas?',
    answer:
      'HairCutsFlow te avisa dentro de la app sobre las citas de mañana y clientes que no agendan hace tiempo, para que no se te pase nada.',
  },
];

export const LandingFAQ: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.background,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 6, md: 9 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Typography
          sx={{
            color: appColors.accent,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textAlign: 'center',
            mb: 1,
          }}
        >
          Preguntas frecuentes
        </Typography>
        <Typography
          sx={{
            color: appColors.textPrimary,
            fontSize: { xs: 26, sm: 32 },
            fontWeight: 700,
            textAlign: 'center',
            mb: { xs: 4, md: 6 },
          }}
        >
          ¿Tenés dudas?
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {FAQS.map(({ question, answer }) => (
            <Accordion
              key={question}
              disableGutters
              elevation={0}
              sx={{
                backgroundColor: appColors.surface,
                border: `1px solid ${appColors.border}`,
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: appColors.accent }} />}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  outline: 'none',
                  '&.Mui-focusVisible': { backgroundColor: `${appColors.accent}1a`, outline: 'none' },
                }}
              >
                <Typography sx={{ color: appColors.textPrimary, fontSize: 14, fontWeight: 700 }}>
                  {question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
                <Typography sx={{ color: appColors.textSecondary, fontSize: 13, lineHeight: '20px' }}>
                  {answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
