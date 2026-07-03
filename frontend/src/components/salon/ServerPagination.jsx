import {
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";

const ServerPagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <small className="text-soft">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
        records
      </small>
      <Pagination size="sm" className="mb-0">
        <PaginationItem disabled={pagination.page <= 1}>
          <PaginationLink
            previous
            href="#previous"
            onClick={(event) => {
              event.preventDefault();
              onPage(pagination.page - 1);
            }}
          />
        </PaginationItem>
        <PaginationItem disabled={pagination.page >= pagination.totalPages}>
          <PaginationLink
            next
            href="#next"
            onClick={(event) => {
              event.preventDefault();
              onPage(pagination.page + 1);
            }}
          />
        </PaginationItem>
      </Pagination>
    </div>
  );
};

export default ServerPagination;
