import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  hideCancel?: boolean;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

interface DialogState extends ConfirmOptions {
  open: boolean;
  resolve: (value: boolean) => void;
}

const emptyState: DialogState = {
  open: false,
  title: '',
  resolve: () => {},
};

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState>(emptyState);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...options, open: true, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    dialog.resolve(result);
    setDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={dialog.open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: appColors.surface,
            borderRadius: '14px',
            border: `1px solid ${appColors.accent}`,
            px: 1,
            py: 1.5,
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: appColors.textPrimary, mb: dialog.message ? 1 : 0 }}>
            {dialog.title}
          </Typography>
          {dialog.message && (
            <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: appColors.textSecondary }}>
              {dialog.message}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: dialog.hideCancel ? 'center' : 'flex-end', gap: 1, px: 1.5 }}>
          {!dialog.hideCancel && (
            <Box
              component="button"
              type="button"
              onClick={() => handleClose(false)}
              sx={{
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: appColors.textSecondary,
                fontSize: 14,
                fontWeight: 700,
                py: 1,
                px: 1.5,
                borderRadius: '8px',
                '&:hover': { backgroundColor: appColors.surfaceElevated },
              }}
            >
              {dialog.cancelText ?? 'Cancelar'}
            </Box>
          )}
          <Box
            component="button"
            type="button"
            onClick={() => handleClose(true)}
            sx={{
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: dialog.destructive ? appColors.error : appColors.accent,
              fontSize: 14,
              fontWeight: 700,
              py: 1,
              px: 1.5,
              borderRadius: '8px',
              '&:hover': { backgroundColor: appColors.surfaceElevated },
            }}
          >
            {dialog.confirmText ?? 'Confirmar'}
          </Box>
        </Box>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
};
