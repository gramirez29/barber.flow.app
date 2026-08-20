import React from 'react';
import { Box } from '@mui/material';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingScreenshots } from './LandingScreenshots';
import { LandingComingSoon } from './LandingComingSoon';
import { Footer } from '@presentation/components/shared';

export const LandingPage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <LandingHero />
      <LandingFeatures />
      <LandingScreenshots />
      <LandingComingSoon />
      <Footer />
    </Box>
  );
};
