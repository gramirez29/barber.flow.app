import { useEffect, useState } from 'react';
import { useAuth } from '@presentation/context/AuthContext';
import { useBarbers } from '@presentation/hooks/useBarbers';

/**
 * Ajuste del barbero logueado "duración ajustable de citas" (`settings.enableAppointmentDurations`),
 * que solo el admin cambia (AGENDA_DURATION_PLAN.md, D8). Apagado por defecto: mientras carga, si el
 * usuario no tiene un `Barber` vinculado (p. ej. la cuenta `admin`) o si la consulta falla, devuelve false
 * y todo se comporta como siempre.
 *
 * `refreshKey` vuelve a leer el ajuste cuando cambia (p. ej. al abrir el formulario) para reflejar un
 * cambio reciente del admin sin recargar la página.
 */
export function useAppointmentDurationsEnabled(refreshKey?: unknown): boolean {
  const { user } = useAuth();
  const { getBarberByUserName } = useBarbers();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user?.userName) {
      setEnabled(false);
      return;
    }
    let active = true;
    void getBarberByUserName(user.userName).then((barber) => {
      if (active) setEnabled(barber?.settings?.enableAppointmentDurations === true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userName, refreshKey]);

  return enabled;
}
