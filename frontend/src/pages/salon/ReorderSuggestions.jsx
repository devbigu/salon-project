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
import {
  compactId,
  formatDate,
  roleCanManage,
} from "@/utils/salonFormat";

const tabs = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CONVERTED_TO_PURCHASE", label: "Converted" },
  { key: "", label: "All" },
];

const ReorderSuggestions = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManage = roleCanManage(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.reorderSuggestions.list({
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

  const act = async (row, action) => {
    setWorkingId(row.id);
    setError("");
    setMessage("");
    try {
      const response = await salonApi.reorderSuggestions[action](row.id);
      if (action === "convert") {
        const purchase = response.data || {};
        setMessage(
          `Purchase ${purchase.purchaseCode || compactId(purchase.purchaseId)} ${
            purchase.alreadyConverted ? "was already linked." : "created and stocked in."
          }`
        );
      }
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setWorkingId("");
    }
  };

  return (
    <PageShell
      title="Reorder suggestions"
      description="Review replenishment quantities generated automatically when products reach low stock."
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
                setMessage("");
              }}
            >
              {tab.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {message && <Alert color="success">{message}</Alert>}
      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        loading={loading}
        rows={rows}
        emptyText="No reorder suggestions."
        columns={[
          {
            key: "product",
            label: "Product",
            render: (value) => value?.name || "—",
          },
          {
            key: "vendor",
            label: "Vendor",
            render: (value) => value?.name || "—",
          },
          { key: "suggestedQuantity", label: "Suggested quantity" },
          {
            key: "branch",
            label: "Branch",
            render: (value) => value?.name || "All branches",
          },
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
          {
            key: "convertedPurchase",
            label: "Purchase",
            render: (value, row) =>
              value?.purchaseCode ||
              (row.convertedPurchaseId
                ? compactId(row.convertedPurchaseId)
                : "—"),
          },
        ]}
        renderActions={
          canManage
            ? (row) => {
                const canApprove = row.status === "PENDING";
                const canReject = ["PENDING", "APPROVED"].includes(row.status);
                const canConvert = ["PENDING", "APPROVED"].includes(row.status);
                if (!canApprove && !canReject && !canConvert) return null;
                return (
                  <>
                    {canApprove && (
                      <Button
                        size="sm"
                        color="success"
                        outline
                        disabled={workingId === row.id}
                        onClick={() => act(row, "approve")}
                      >
                        Approve
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        size="sm"
                        color="danger"
                        outline
                        className="ms-1"
                        disabled={workingId === row.id}
                        onClick={() => act(row, "reject")}
                      >
                        Reject
                      </Button>
                    )}
                    {canConvert && (
                      <Button
                        size="sm"
                        color="primary"
                        className="ms-1"
                        disabled={workingId === row.id}
                        onClick={() => act(row, "convert")}
                      >
                        Convert to purchase
                      </Button>
                    )}
                  </>
                );
              }
            : undefined
        }
      />
      <ServerPagination pagination={pagination} onPage={setPage} />
    </PageShell>
  );
};

export default ReorderSuggestions;
