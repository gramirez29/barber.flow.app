import React from 'react';
import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Box, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeContext } from '@presentation/context/ThemeContext';
import { appColors } from '@presentation/theme/appColors';

interface AppBarProps {
  onMenuClick: () => void;
  title?: string;
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, title = 'Barber Flow' }) => {
  const { isDark, setMode } = useThemeContext();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleThemeToggle = () => {
    const newMode: 'light' | 'dark' | 'system' = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: appColors.surface,
        borderBottom: `1px solid ${appColors.border}`,
      }}
    >
      <Toolbar>
        {!isDesktop && (
          <IconButton
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2, color: appColors.textPrimary }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: appColors.textPrimary }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleThemeToggle} sx={{ color: appColors.accent }}>
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
