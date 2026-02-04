import { useState, useEffect } from 'react';

/**
 * Hook que retrasa la actualización de un valor
 * Útil para búsquedas en tiempo real, evitando llamadas excesivas
 *
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos (default: 300ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer timeout para actualizar el valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si value cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
