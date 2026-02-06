import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  pageSize: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  pageData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  pageSize: number;
}

export function usePagination<T>({
  data,
  pageSize: initialPageSize
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  // Reset a página 1 cuando cambia data o pageSize
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [data.length]);

  // Ajustar página actual si excede totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Obtener datos de la página actual
  const pageData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Funciones de navegación
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSetPageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset a primera página al cambiar tamaño
  };

  return {
    currentPage,
    totalPages,
    pageData,
    goToPage,
    nextPage,
    prevPage,
    setPageSize: handleSetPageSize,
    pageSize
  };
}
