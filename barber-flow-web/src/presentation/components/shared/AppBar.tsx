import React from 'react';
import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeContext } from '@presentation/context/ThemeContext';
import { useAuth } from '@presentation/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppBarProps {
  onMenuClick: () => void;
  title?: string;
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, title = 'Barber Flow' }) => {
  const { isDark, setMode } = useThemeContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleThemeToggle = () => {
    const newMode: 'light' | 'dark' | 'system' = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  return (
    <MuiAppBar position="static">
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="inherit" onClick={handleThemeToggle}>
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
          >
            <AccountCircle />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="body2">{user?.name}</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
};
