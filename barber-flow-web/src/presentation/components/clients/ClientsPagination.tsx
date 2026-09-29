import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { appColors } from '@presentation/theme/appColors';

interface ClientsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonSx = (disabled: boolean) => ({
  width: 40,
  height: 40,
  borderRadius: '10px',
  border: `1px solid ${appColors.border}`,
  color: disabled ? appColors.textSecondary : appColors.accent,
  '&.Mui-disabled': { opacity: 0.35, color: appColors.textSecondary },
});

export const ClientsPagination: React.FC<ClientsPaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5, mt: 2, mb: 1 }}>
      <IconButton
        aria-label="Página anterior"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        sx={buttonSx(page === 1)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: appColors.textPrimary, textAlign: 'center' }}>
        Página {page} de {totalPages}
      </Typography>
      <IconButton
        aria-label="Página siguiente"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        sx={buttonSx(page === totalPages)}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};
