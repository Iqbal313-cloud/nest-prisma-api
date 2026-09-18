export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    lastPage: Math.ceil(total / limit),
    limit,
  };
}

export function getPagination(page = 1, limit = 10) {
  const currentPage = Number(page);
  const currentLimit = Number(limit);

  return {
    page: currentPage,
    limit: currentLimit,
    skip: (currentPage - 1) * currentLimit,
    take: currentLimit,
  };
}
