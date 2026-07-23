import React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,

  Box,
} from '@mui/material';

export interface FormTextFieldProps extends Omit<MuiTextFieldProps, 'error'> {
  error?: string;
  isTouched?: boolean;
  helperText?: string;
}

/**
 * FormTextField: Componente reutilizable de TextField con validación
 *
 * Features:
 * - Muestra errores solo si el campo fue tocado
 * - Integración con useForm hook
 * - Estilos consistentes con Material Design 3
 * - Accesibilidad mejorada
 */
export const FormTextField = React.forwardRef<HTMLInputElement, FormTextFieldProps>(
  ({ error, isTouched, helperText, ...props }, ref) => {
    const hasError = isTouched && !!error;

    return (
      <Box sx={{ width: '100%' }}>
        <MuiTextField
          ref={ref}
          fullWidth
          error={hasError}
          helperText={hasError ? error : helperText}
          {...props}
          sx={{
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
              },
            },
            ...props.sx,
          }}
        />
      </Box>
    );
  }
);

FormTextField.displayName = 'FormTextField';
