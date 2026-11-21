import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, Box, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { appColors } from '@presentation/theme/appColors';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  /**
   * 'danger' renders the red "last warning" modal used before irreversible deletions: red border,
   * warning icon, the list of what will be lost and a solid red confirm button. The cancel button is
   * the visually safe choice.
   */
  variant?: 'danger';
  /** Items listed under the message (what will be lost). Only shown with variant 'danger'. */
  details?: string[];
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /**
   * Two-step verification for irreversible actions: a regular destructive dialog first and, only if the
   * user continues, a red danger modal. Resolves true only when BOTH were confirmed.
   */
  confirmTwice: (first: ConfirmOptions, second: Omit<ConfirmOptions, 'variant'>) => Promise<boolean>;
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

const DANGER_BG = '#2A1515';

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState>(emptyState);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...options, open: true, resolve });
    });
  }, []);

  const confirmTwice = useCallback(
    async (first: ConfirmOptions, second: Omit<ConfirmOptions, 'variant'>) => {
      const proceed = await confirm({ ...first, destructive: true });
      if (!proceed) return false;
      return confirm({ ...second, variant: 'danger', destructive: true });
    },
    [confirm]
  );

  const handleClose = (result: boolean) => {
    dialog.resolve(result);
    setDialog((prev) => ({ ...prev, open: false }));
  };

  const isDanger = dialog.variant === 'danger';

  return (
    <ConfirmDialogContext.Provider value={{ confirm, confirmTwice }}>
      {children}
      <Dialog
        open={dialog.open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDanger ? DANGER_BG : appColors.surface,
            borderRadius: '14px',
            border: `${isDanger ? 2 : 1}px solid ${isDanger ? appColors.error : appColors.accent}`,
            px: 1,
            py: 1.5,
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
          {isDanger && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: appColors.errorBg,
                border: `1px solid ${appColors.error}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 28, color: appColors.error }} />
            </Box>
          )}
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              color: isDanger ? appColors.error : appColors.textPrimary,
              mb: dialog.message ? 1 : 0,
            }}
          >
            {dialog.title}
          </Typography>
          {dialog.message && (
            <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: isDanger ? appColors.textPrimary : appColors.textSecondary }}>
              {dialog.message}
            </Typography>
          )}
          {isDanger && dialog.details && dialog.details.length > 0 && (
            <Box
              component="ul"
              sx={{
                m: 0,
                mt: 1.5,
                pl: 2.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                fontSize: 14,
                color: appColors.textSecondary,
                '& li::marker': { color: appColors.error },
              }}
            >
              {dialog.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isDanger ? 'column' : 'row',
            justifyContent: dialog.hideCancel ? 'center' : 'flex-end',
            gap: 1,
            px: 1.5,
          }}
        >
          {!dialog.hideCancel && (
            <Box
              component="button"
              type="button"
              onClick={() => handleClose(false)}
              sx={{
                cursor: 'pointer',
                backgroundColor: isDanger ? appColors.surfaceElevated : 'transparent',
                border: isDanger ? `1px solid ${appColors.border}` : 'none',
                color: isDanger ? appColors.textPrimary : appColors.textSecondary,
                fontSize: 14,
                fontWeight: 700,
                py: isDanger ? 1.25 : 1,
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
              backgroundColor: isDanger ? appColors.error : 'transparent',
              color: isDanger ? '#FFFFFF' : dialog.destructive ? appColors.error : appColors.accent,
              fontSize: 14,
              fontWeight: 700,
              py: isDanger ? 1.25 : 1,
              px: 1.5,
              borderRadius: '8px',
              '&:hover': { backgroundColor: isDanger ? '#B91C1C' : appColors.surfaceElevated },
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
