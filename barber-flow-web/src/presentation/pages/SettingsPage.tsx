import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
  SettingsHeroCard,
  AdminAccessCard,
  PreferencesCard,
  ReportCalculationSettingsCard,
  ApplicationUsersCard,
  ApplicationUsersDialog,
  AboutCard,
} from '@presentation/components/settings';
import { useAuth } from '@presentation/context/AuthContext';
import { useAdminAccess } from '@presentation/context/AdminAccessContext';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isSafeModeEnabled, setSafeModeEnabled } = useAdminAccess();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = user?.role === 'Admin';

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(${appColors.overlay}, ${appColors.overlay}), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        backgroundAttachment: 'fixed',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SettingsHeroCard />

        {isAdmin && (
          <AdminAccessCard isSafeModeEnabled={isSafeModeEnabled} onToggle={setSafeModeEnabled} />
        )}

        <PreferencesCard />

        <ReportCalculationSettingsCard />

        {isAdmin && <ApplicationUsersCard onOpen={() => setDialogOpen(true)} />}

        <AboutCard />
      </Box>

      <ApplicationUsersDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
};
