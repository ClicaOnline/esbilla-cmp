import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchProps<T> {
  data: T[];
  searchKeys: (keyof T)[];
  searchTerm: string;
}

interface UseSearchReturn<T> {
  filteredData: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
}

/**
 * Hook para búsqueda con debounce y filtrado case-insensitive
 *
 * @param data - Array de datos a buscar
 * @param searchKeys - Campos donde buscar
 * @param searchTerm - Término de búsqueda
 * @returns Datos filtrados y funciones de control
 */
export function useSearch<T>({
  data,
  searchKeys,
  searchTerm
}: UseSearchProps<T>): Omit<UseSearchReturn<T>, 'searchTerm' | 'setSearchTerm'> {
  // Aplicar debounce al término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar datos basándose en el término debounced
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return data;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();

    return data.filter(item => {
      return searchKeys.some(key => {
        const value = item[key];

        if (value === null || value === undefined) {
          return false;
        }

        // Si es un array (ej: domains), buscar en cada elemento
        if (Array.isArray(value)) {
          return value.some(v =>
            String(v).toLowerCase().includes(searchLower)
          );
        }

        // Si es un objeto, convertir a JSON para buscar
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(searchLower);
        }

        // Caso normal: string o número
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, debouncedSearchTerm, searchKeys]);

  return {
    filteredData,
    debouncedSearchTerm
  };
}

/**
 * Hook completo con state interno para el término de búsqueda
 */
export function useSearchWithState<T>({
  data,
  searchKeys
}: Omit<UseSearchProps<T>, 'searchTerm'>): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState('');

  const { filteredData, debouncedSearchTerm } = useSearch({
    data,
    searchKeys,
    searchTerm
  });

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm
  };
}
