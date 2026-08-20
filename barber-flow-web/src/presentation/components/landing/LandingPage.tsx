import React from 'react';
import { Box } from '@mui/material';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingScreenshots } from './LandingScreenshots';
import { LandingTrust } from './LandingTrust';
import { LandingFAQ } from './LandingFAQ';
import { LandingComingSoon } from './LandingComingSoon';
import { LandingFinalCta } from './LandingFinalCta';
import { Footer } from '@presentation/components/shared';

export const LandingPage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingScreenshots />
      <LandingTrust />
      <LandingFAQ />
      <LandingComingSoon />
      <LandingFinalCta />
      <Footer />
    </Box>
  );
};
