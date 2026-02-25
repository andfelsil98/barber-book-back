export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Valores por defecto cuando el usuario no envía page/pageSize (paginación obligatoria a nivel endpoint). */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  pagination: Pagination;
}

export function buildPagination(
  page: number,
  pageSize: number,
  totalItems: number
): Pagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}
