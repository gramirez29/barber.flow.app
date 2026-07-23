import React from 'react';
import { Drawer as MuiDrawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box } from '@mui/material';
import { DateRange, People, BarChart, Settings, Home } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Citas', path: '/appointments', icon: DateRange },
  { label: 'Clientes', path: '/clients', icon: People },
  { label: 'Reportes', path: '/reports', icon: BarChart },
  { label: 'Configuración', path: '/settings', icon: Settings },
];

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <MuiDrawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280 }}>
        <Box sx={{ p: 2 }}>
          {/* Logo/Header */}
        </Box>
        <Divider />

        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </MuiDrawer>
  );
};
