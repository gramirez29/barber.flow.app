import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { appColors } from '@presentation/theme/appColors';

// Icons rotate for visual variety; the copy stays generic on purpose — there's no real
// content behind these cards yet, only the section itself is confirmed.
const CARD_ICONS = [ArticleOutlinedIcon, TipsAndUpdatesOutlinedIcon, MenuBookOutlinedIcon, CampaignOutlinedIcon];
const PLACEHOLDER_CARDS = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  icon: CARD_ICONS[index % CARD_ICONS.length],
}));

const CARD_WIDTH = 220;

export const LandingComingSoon: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollByCards = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * (CARD_WIDTH + 16) * 2, behavior: 'smooth' });
  };

  // Browsers can restore a scrollable element's scrollLeft on reload/back-forward navigation
  // before React re-renders — force it back to the start so the arrows' visibility matches.
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollLeft = 0;
    }
    updateScrollButtons();
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: appColors.background,
        px: { xs: 2.5, sm: 4 },
        pt: '10px',
        pb: { xs: 6, md: 9 },
      }}
    >
      <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1,
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              backgroundColor: `${appColors.accent}1a`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <ConstructionIcon sx={{ fontSize: 22, color: appColors.accent }} />
          </Box>
          <Typography sx={{ color: appColors.textPrimary, fontSize: 20, fontWeight: 700 }}>
            Contenido relevante
          </Typography>
          <Typography sx={{ color: appColors.textSecondary, fontSize: 14, lineHeight: '21px', maxWidth: 480 }}>
            Estamos preparando guías, novedades y recursos para barberías. Muy pronto vas a
            encontrar más contenido acá.
          </Typography>
          <Typography
            sx={{
              color: appColors.accent,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              mt: 0.5,
            }}
          >
            En construcción
          </Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Box
            ref={scrollerRef}
            onScroll={updateScrollButtons}
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {PLACEHOLDER_CARDS.map(({ id, icon: Icon }) => (
              <Box
                key={id}
                sx={{
                  flex: `0 0 ${CARD_WIDTH}px`,
                  scrollSnapAlign: 'start',
                  backgroundColor: appColors.surface,
                  border: `1px solid ${appColors.border}`,
                  borderRadius: '16px',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1.25,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '12px',
                    backgroundColor: `${appColors.accent}1a`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 19, color: appColors.accent }} />
                </Box>
                <Typography sx={{ color: appColors.textPrimary, fontSize: 14, fontWeight: 700 }}>
                  Próximamente
                </Typography>
                <Typography sx={{ color: appColors.textSecondary, fontSize: 12, lineHeight: '18px' }}>
                  Nuevo contenido en camino.
                </Typography>
              </Box>
            ))}
          </Box>

          <IconButton
            onClick={() => scrollByCards(-1)}
            aria-label="Anterior"
            disabled={!canScrollLeft}
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'absolute',
              left: -48,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: appColors.surfaceElevated,
              border: `1px solid ${appColors.border}`,
              color: appColors.textPrimary,
              opacity: canScrollLeft ? 1 : 0,
              pointerEvents: canScrollLeft ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
              '&:hover': { backgroundColor: appColors.surface },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={() => scrollByCards(1)}
            aria-label="Siguiente"
            disabled={!canScrollRight}
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'absolute',
              right: -48,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: appColors.surfaceElevated,
              border: `1px solid ${appColors.border}`,
              color: appColors.textPrimary,
              opacity: canScrollRight ? 1 : 0,
              pointerEvents: canScrollRight ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
              '&:hover': { backgroundColor: appColors.surface },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
