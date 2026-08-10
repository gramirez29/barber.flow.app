import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, InputAdornment } from '@mui/material';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { appColors } from '@presentation/theme/appColors';
import { useAuth } from '@presentation/context/AuthContext';
import { useBarbers } from '@presentation/hooks/useBarbers';
import { Barber } from '@domain/entities/Barber';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: appColors.surfaceElevated,
    borderRadius: '12px',
    fontSize: '15px',
    color: appColors.textPrimary,
    '& fieldset': { borderColor: appColors.border },
    '&:hover fieldset': { borderColor: appColors.accent },
    '&.Mui-focused fieldset': { borderColor: appColors.accent },
  },
  '& .MuiInputLabel-root': {
    color: appColors.textSecondary,
    '&.Mui-focused': { color: appColors.accent },
  },
};

const DEFAULT_SETTINGS = { commissionPercentage: 40, fixedDailyExpense: 0 };

export const ReportCalculationSettingsCard: React.FC = () => {
  const { user } = useAuth();
  const { getBarberByUserName, updateBarber } = useBarbers();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [commissionPercentage, setCommissionPercentage] = useState(DEFAULT_SETTINGS.commissionPercentage);
  const [fixedDailyExpense, setFixedDailyExpense] = useState(DEFAULT_SETTINGS.fixedDailyExpense);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user?.userName) {
        setLoading(false);
        return;
      }

      const found = await getBarberByUserName(user.userName);
      if (!active) return;

      setBarber(found);
      setCommissionPercentage(found?.settings?.commissionPercentage ?? DEFAULT_SETTINGS.commissionPercentage);
      setFixedDailyExpense(found?.settings?.fixedDailyExpense ?? DEFAULT_SETTINGS.fixedDailyExpense);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userName]);

  const persistSettings = async (nextCommission: number, nextExpense: number) => {
    if (!barber) return;

    setSaving(true);
    try {
      const updated = await updateBarber(barber.id, {
        userName: barber.userName,
        userPhone: barber.userPhone,
        userEmail: barber.userEmail,
        barberName: barber.barberName,
        barberPhone: barber.barberPhone,
        address: barber.address,
        barberShopName: barber.barberShopName,
        barberShopPhone: barber.barberShopPhone,
        photoUrl: barber.photoUrl,
        settings: { commissionPercentage: nextCommission, fixedDailyExpense: nextExpense },
      });
      setBarber(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => persistSettings(commissionPercentage, fixedDailyExpense);

  const handleReset = () => {
    setCommissionPercentage(DEFAULT_SETTINGS.commissionPercentage);
    setFixedDailyExpense(DEFAULT_SETTINGS.fixedDailyExpense);
    void persistSettings(DEFAULT_SETTINGS.commissionPercentage, DEFAULT_SETTINGS.fixedDailyExpense);
  };

  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: appColors.accent,
        }}
      >
        Cálculos de cierre diario
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Comisión y gasto fijo
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={22} sx={{ color: appColors.accent }} />
        </Box>
      ) : !barber ? (
        <Box
          sx={{
            mt: 2,
            backgroundColor: appColors.surfaceElevated,
            border: `1px solid ${appColors.border}`,
            borderRadius: '14px',
            px: 2,
            py: 2,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: appColors.textPrimary, mb: 0.5 }}>
            No hay una cuenta de Barbero vinculada a tu usuario
          </Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, lineHeight: 1.5 }}>
            Los Reportes usan una comisión del 40% y gasto fijo ₡0 por defecto hasta que un
            administrador cree un usuario de aplicación con tu mismo nombre de usuario (
            {user?.userName ?? '—'}).
          </Typography>
        </Box>
      ) : (
        <>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
            Estos valores se usan para calcular la ganancia neta en el Reporte diario.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormTextField
              id="commissionPercentage"
              label="Comisión del barbero"
              type="number"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(Number(e.target.value))}
              disabled={saving}
              inputProps={{ min: 0, max: 100, step: '0.1' }}
              sx={{ ...inputSx, flex: 1, minWidth: 180 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />
            <FormTextField
              id="fixedDailyExpense"
              label="Gasto fijo diario"
              type="number"
              value={fixedDailyExpense}
              onChange={(e) => setFixedDailyExpense(Number(e.target.value))}
              disabled={saving}
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ ...inputSx, flex: 1, minWidth: 180 }}
              InputProps={{ startAdornment: <InputAdornment position="start">CRC</InputAdornment> }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.25, mt: 2 }}>
            <Box
              component="button"
              type="button"
              onClick={handleSave}
              disabled={saving}
              sx={{
                flex: 1,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: appColors.accent,
                color: appColors.onAccent,
                borderRadius: '12px',
                py: 1.25,
                fontSize: 14,
                fontWeight: 700,
                opacity: saving ? 0.6 : 1,
                '&:hover': { backgroundColor: appColors.accentLight },
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Box>
            <Box
              component="button"
              type="button"
              onClick={handleReset}
              disabled={saving}
              sx={{
                flex: 1,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: appColors.textSecondary,
                border: `1px solid ${appColors.border}`,
                borderRadius: '12px',
                py: 1.25,
                fontSize: 14,
                fontWeight: 600,
                '&:hover': { borderColor: appColors.accent },
              }}
            >
              Restablecer
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};
