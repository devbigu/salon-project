/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Alert, Input } from "reactstrap";
import { Button } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import DataGrid from "@/components/salon/DataGrid";
import SchemaModal from "@/components/salon/SchemaModal";
import ServerPagination from "@/components/salon/ServerPagination";
import StatusBadge from "@/components/salon/StatusBadge";
import { salonApi } from "@/services/salonApi";
import { formatDate } from "@/utils/salonFormat";
import { useAuth } from "@/auth/AuthContext";

const initialCustomerId =
  new URLSearchParams(window.location.search).get("customerId") || "";

const LoyaltyTransactions = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    customerId: initialCustomerId,
    search: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [adjust, setAdjust] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.loyalty.transactions({
        page,
        limit: 25,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });
      setRows(response.data || []);
      setPagination(response.pagination || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    salonApi.customers
      .list()
      .then((response) => setCustomers(response.data || []))
      .catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const selectedCustomer = customers.find(
    (customer) => customer.id === filters.customerId
  );

  return (
    <PageShell
      title="Loyalty transactions"
      description="Review point earnings, redemptions, and manual adjustments."
    >
      {error && <Alert color="danger">{error}</Alert>}
      <div className="card card-bordered mb-3">
        <div className="card-inner d-flex gap-2 flex-wrap">
          <Input
            value={filters.search}
            placeholder="Search customer, phone, code, note or reference"
            style={{ minWidth: 280, flex: 1 }}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
          <Input
            type="select"
            value={filters.customerId}
            style={{ maxWidth: 260 }}
            onChange={(event) =>
              updateFilter("customerId", event.target.value)
            }
          >
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customerCode} · {customer.name}
              </option>
            ))}
          </Input>
          <Input
            type="select"
            value={filters.type}
            style={{ maxWidth: 180 }}
            onChange={(event) => updateFilter("type", event.target.value)}
          >
            <option value="">All types</option>
            {["EARNED", "REDEEMED", "ADJUSTED", "EXPIRED"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Input>
          <Input
            type="date"
            value={filters.startDate}
            style={{ maxWidth: 170 }}
            onChange={(event) =>
              updateFilter("startDate", event.target.value)
            }
          />
          <Input
            type="date"
            value={filters.endDate}
            style={{ maxWidth: 170 }}
            onChange={(event) =>
              updateFilter("endDate", event.target.value)
            }
          />
          {["SUPER_ADMIN", "SALON_ADMIN"].includes(user?.role) && (
            <Button
              color="primary"
              disabled={!filters.customerId}
              onClick={() => setAdjust(true)}
            >
              Adjust points
            </Button>
          )}
        </div>
      </div>
      {selectedCustomer && (
        <Alert color="light">
          {selectedCustomer.name}:{" "}
          <strong>{selectedCustomer.loyaltyPoints} points</strong>
        </Alert>
      )}
      <DataGrid
        rows={rows}
        loading={loading}
        columns={[
          {
            key: "customer",
            label: "Customer",
            render: (value) =>
              value
                ? `${value.customerCode} · ${value.name}`
                : "—",
          },
          {
            key: "type",
            label: "Type",
            render: (value) => <StatusBadge value={value} />,
          },
          { key: "points", label: "Points" },
          { key: "balanceBefore", label: "Before" },
          { key: "balanceAfter", label: "After" },
          { key: "referenceType", label: "Reference type" },
          { key: "referenceId", label: "Reference" },
          { key: "note", label: "Note" },
          {
            key: "createdAt",
            label: "Created",
            render: (value) => formatDate(value, true),
          },
        ]}
      />
      <ServerPagination pagination={pagination} onPage={setPage} />
      <SchemaModal
        isOpen={adjust}
        toggle={() => setAdjust(false)}
        title={`Adjust loyalty points · ${selectedCustomer?.name || ""}`}
        submitLabel="Apply"
        fields={[
          {
            name: "points",
            label: "Points (+ or -)",
            type: "number",
            step: 1,
            required: true,
          },
          {
            name: "note",
            label: "Reason",
            type: "textarea",
            fullWidth: true,
          },
        ]}
        onSubmit={async (values) => {
          await salonApi.loyalty.adjust(filters.customerId, values);
          await load();
        }}
      />
    </PageShell>
  );
};

export default LoyaltyTransactions;
