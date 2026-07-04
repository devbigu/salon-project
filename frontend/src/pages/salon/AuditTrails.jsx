/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from "reactstrap";
import { Button } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import ServerPagination from "@/components/salon/ServerPagination";
import StatusBadge from "@/components/salon/StatusBadge";
import { salonApi } from "@/services/salonApi";
import { formatDate, labelize } from "@/utils/salonFormat";

const modules = [
  "AUTH",
  "APPOINTMENT",
  "INVOICE",
  "PAYMENT",
  "SALARY",
  "CUSTOMER",
  "STAFF",
  "INVENTORY",
  "SUPPORT_TICKET",
  "REORDER",
  "MEMBERSHIP",
  "LOYALTY",
  "COUPON",
  "PUBLIC_BOOKING",
  "JOB_CART",
  "SYSTEM",
];

const actions = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "CANCEL",
  "COMPLETE",
  "PAYMENT_RECORDED",
  "STOCK_MOVEMENT",
  "SALARY_CHANGED",
  "SALARY_GENERATED",
  "SALARY_PAID",
  "SUPPORT_RESOLVED",
  "APPROVE",
  "REJECT",
  "CONVERT",
  "STATUS_CHANGE",
];

const emptyFilters = {
  startDate: "",
  endDate: "",
  module: "",
  action: "",
  userId: "",
  branchId: "",
  search: "",
};

const JsonBlock = ({ value }) => (
  <pre className="audit-details-json bg-lighter rounded p-3 mb-0">
    {value !== null && value !== undefined
      ? JSON.stringify(value, null, 2)
      : "No data captured."}
  </pre>
);

const AuditTrails = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [refs, setRefs] = useState({ users: [], branches: [] });
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.auditLogs.list({
        page,
        limit: 25,
        ...Object.fromEntries(
          Object.entries(applied).filter(([, value]) => value !== "")
        ),
      });
      setRows(response.data || []);
      setPagination(response.pagination || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.allSettled([salonApi.users.list(), salonApi.branches.list()]).then(
      ([users, branches]) =>
        setRefs({
          users: users.status === "fulfilled" ? users.value.data || [] : [],
          branches:
            branches.status === "fulfilled" ? branches.value.data || [] : [],
        })
    );
  }, []);

  const submit = (event) => {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  return (
    <PageShell
      title="Audit trails"
      description="A tenant-scoped activity history for security, operational, and financial actions."
    >
      <Form onSubmit={submit} className="card card-bordered mb-4">
        <div className="card-inner">
          <Row className="g-3">
            <Col md="3">
              <FormGroup>
                <Label>From</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label>To</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label>Module</Label>
                <Input
                  type="select"
                  value={filters.module}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      module: event.target.value,
                    }))
                  }
                >
                  <option value="">All modules</option>
                  {modules.map((module) => (
                    <option value={module} key={module}>
                      {labelize(module)}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label>Action</Label>
                <Input
                  type="select"
                  value={filters.action}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      action: event.target.value,
                    }))
                  }
                >
                  <option value="">All actions</option>
                  {actions.map((action) => (
                    <option value={action} key={action}>
                      {labelize(action)}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label>User</Label>
                <Input
                  type="select"
                  value={filters.userId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                >
                  <option value="">All users</option>
                  {refs.users.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label>Branch</Label>
                <Input
                  type="select"
                  value={filters.branchId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      branchId: event.target.value,
                    }))
                  }
                >
                  <option value="">All branches</option>
                  {refs.branches.map((branch) => (
                    <option value={branch.id} key={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Search</Label>
                <div className="d-flex gap-2">
                  <Input
                    value={filters.search}
                    placeholder="Description, user, or entity"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                  />
                  <Button type="submit" color="primary">
                    Apply
                  </Button>
                  <Button
                    type="button"
                    color="light"
                    onClick={() => {
                      setFilters(emptyFilters);
                      setApplied(emptyFilters);
                      setPage(1);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </FormGroup>
            </Col>
          </Row>
        </div>
      </Form>

      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        loading={loading}
        rows={rows}
        emptyText="No audit activity found."
        columns={[
          {
            key: "createdAt",
            label: "Time",
            render: (value) => formatDate(value, true),
          },
          { key: "userName", label: "User", render: (value) => value || "System" },
          { key: "userRole", label: "Role", render: labelize },
          { key: "module", label: "Module", render: labelize },
          {
            key: "action",
            label: "Action",
            render: (value) => <StatusBadge value={value} />,
          },
          { key: "description", label: "Description" },
          {
            key: "entityCode",
            label: "Entity",
            render: (value, row) =>
              value || row.entityName || row.entityId?.slice(0, 8) || "—",
          },
          { key: "ipAddress", label: "IP", render: (value) => value || "—" },
        ]}
        renderActions={(row) => (
          <Button size="sm" color="primary" outline onClick={() => setDetails(row)}>
            View Details
          </Button>
        )}
      />
      <ServerPagination pagination={pagination} onPage={setPage} />

      <Modal isOpen={Boolean(details)} toggle={() => setDetails(null)} size="lg" centered>
        <ModalHeader toggle={() => setDetails(null)}>Audit log details</ModalHeader>
        <ModalBody>
          {details && (
            <div className="d-grid gap-3">
              <div>
                <strong>Description</strong>
                <p className="mb-0">{details.description}</p>
              </div>
              <Row>
                <Col md="6">
                  <strong>IP address</strong>
                  <p>{details.ipAddress || "—"}</p>
                </Col>
                <Col md="6">
                  <strong>Created</strong>
                  <p>{formatDate(details.createdAt, true)}</p>
                </Col>
              </Row>
              <div>
                <strong>User agent</strong>
                <p className="text-break">{details.userAgent || "—"}</p>
              </div>
              <div>
                <strong>Old data</strong>
                <JsonBlock value={details.oldData} />
              </div>
              <div>
                <strong>New data</strong>
                <JsonBlock value={details.newData} />
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </PageShell>
  );
};

export default AuditTrails;
