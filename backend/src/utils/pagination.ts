export const parsePagination = (query: Record<string, unknown>) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const requestedLimit = query.limit === undefined ? 25 : Number(query.limit);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1
  ) {
    return { error: "page and limit must be positive integers" } as const;
  }
  const limit = Math.min(requestedLimit, 100);
  return { page, limit, skip: (page - 1) * limit } as const;
};

export const paginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
