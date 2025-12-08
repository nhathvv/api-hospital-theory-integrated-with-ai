/**
 * Sort Order Constants
 */
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderType = (typeof SortOrder)[keyof typeof SortOrder];

/**
 * Pagination Default Values
 */
export const PaginationDefault = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: 'createdAt',
  SORT_ORDER: SortOrder.DESC,
} as const;
