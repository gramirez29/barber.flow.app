import React, { useEffect, useState } from 'react';
import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Client } from '@domain/entities/Client';
import { useClients } from '@presentation/hooks/useClients';
import { appColors } from '@presentation/theme/appColors';

interface ClientAutocompleteProps {
  onSelect: (client: Client) => void;
  disabled?: boolean;
}

const getLabel = (client: Client) => `${client.firstName} ${client.lastName}`.trim();

/**
 * Buscador de cliente para el formulario de cita (solo con la agenda por horas activa). Al elegir uno,
 * el formulario precarga nombre, teléfono y método de pago; los campos siguen siendo editables.
 */
export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({ onSelect, disabled = false }) => {
  const { clients, isLoadingClients, searchClients } = useClients();
  const [inputValue, setInputValue] = useState('');

  // Búsqueda en el servidor con debounce (mismo criterio que la pantalla de Clientes).
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void searchClients(inputValue.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <Autocomplete<Client, false, false, false>
      options={clients}
      loading={isLoadingClients}
      disabled={disabled}
      value={null}
      inputValue={inputValue}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') setInputValue(value);
      }}
      onChange={(_, client) => {
        if (client) {
          onSelect(client);
          setInputValue('');
        }
      }}
      // El filtrado ya lo hace el backend.
      filterOptions={(options) => options}
      getOptionLabel={getLabel}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText="Sin clientes que coincidan"
      loadingText="Buscando clientes..."
      slotProps={{
        paper: {
          sx: {
            backgroundColor: appColors.surfaceElevated,
            color: appColors.textPrimary,
            border: `1px solid ${appColors.border}`,
            borderRadius: '12px',
            '& .MuiAutocomplete-option': { fontSize: 14 },
            '& .MuiAutocomplete-option.Mui-focused': { backgroundColor: `${appColors.accent}22` },
            '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': { color: appColors.textSecondary },
          },
        },
      }}
      renderOption={(props, client) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        return (
          <li key={key} {...rest}>
            <span style={{ fontWeight: 600 }}>{getLabel(client)}</span>
            <span style={{ marginLeft: 8, color: appColors.textSecondary, fontSize: 13 }}>{client.phone}</span>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar cliente"
          placeholder="Nombre, teléfono o correo"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: appColors.textSecondary }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          sx={{
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
            '& .MuiSvgIcon-root': { color: appColors.textSecondary },
          }}
        />
      )}
    />
  );
};
