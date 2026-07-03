/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Alert, Nav, NavItem, NavLink } from "reactstrap";
import { Button } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import ServerPagination from "@/components/salon/ServerPagination";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatDate, roleCanManage } from "@/utils/salonFormat";

const tabs = [
  { key: "OPEN", label: "Open" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "", label: "All" },
];

const StockAlerts = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const canManage = roleCanManage(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.stockAlerts.list({
        page,
        limit: 25,
        ...(status ? { status } : {}),
      });
      setRows(response.data || []);
      setPagination(response.pagination || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (row) => {
    setWorkingId(row.id);
    setError("");
    try {
      await salonApi.stockAlerts.resolve(row.id);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setWorkingId("");
    }
  };

  return (
    <PageShell
      title="Stock alerts"
      description="Persistent low-stock alerts created automatically by inventory movements."
    >
      <Nav tabs className="mb-4">
        {tabs.map((tab) => (
          <NavItem key={tab.label}>
            <NavLink
              href={`#${tab.label.toLowerCase()}`}
              active={status === tab.key}
              onClick={(event) => {
                event.preventDefault();
                setStatus(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        loading={loading}
        rows={rows}
        emptyText="No stock alerts."
        columns={[
          {
            key: "product",
            label: "Product",
            render: (value) => value?.name || "—",
          },
          {
            key: "branch",
            label: "Branch",
            render: (value) => value?.name || "All branches",
          },
          { key: "currentStock", label: "Current stock" },
          { key: "threshold", label: "Threshold" },
          {
            key: "status",
            label: "Status",
            render: (value) => <StatusBadge value={value} />,
          },
          {
            key: "createdAt",
            label: "Created",
            render: (value) => formatDate(value, true),
          },
        ]}
        renderActions={
          canManage
            ? (row) =>
                row.status === "OPEN" ? (
                  <Button
                    size="sm"
                    color="success"
                    outline
                    disabled={workingId === row.id}
                    onClick={() => resolve(row)}
                  >
                    Resolve
                  </Button>
                ) : null
            : undefined
        }
      />
      <ServerPagination pagination={pagination} onPage={setPage} />
    </PageShell>
  );
};

export default StockAlerts;
