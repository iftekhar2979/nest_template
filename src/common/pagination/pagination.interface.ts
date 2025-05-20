export interface IPagination {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    nextPage: number | null;
    previousPage: number | null;
    itemsPerPage: number;
  }
  