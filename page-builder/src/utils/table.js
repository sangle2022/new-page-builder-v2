// Shared table paging: 10 rows to start, the user can show more.
// defaultPageSize (not pageSize) keeps the size changer working.
export const TABLE_PAGINATION = {
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100],
  showTotal: (total, [from, to]) => `${from}-${to} of ${total}`,
};
