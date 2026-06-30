/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Alert } from "reactstrap";
import { Button, Icon } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import SchemaModal from "@/components/salon/SchemaModal";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatDate, formatMoney } from "@/utils/salonFormat";

const methods = ["CASH", "UPI", "GPAY", "PAYTM", "PHONEPE", "CARD", "BANK_TRANSFER", "CHEQUE", "OTHER"];

const VendorPayments = () => {
  const { user } = useAuth();
  const [refs, setRefs] = useState({ vendors: [], purchases: [], branches: [], salons: [] });
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      salonApi.vendors.list({ status: true }),
      salonApi.productPurchases.list(),
      salonApi.branches.list(),
      user?.role === "SUPER_ADMIN" ? salonApi.salons.list() : Promise.resolve({ data: [] }),
      salonApi.vendorPayments.list(),
    ]);
    setRefs({
      vendors: results[0].status === "fulfilled" ? results[0].value.data || [] : [],
      purchases: results[1].status === "fulfilled" ? results[1].value.data || [] : [],
      branches: results[2].status === "fulfilled" ? results[2].value.data || [] : [],
      salons: results[3].status === "fulfilled" ? results[3].value.data || [] : [],
    });
    if (results[4].status === "fulfilled") setRows(results[4].value.data || []);
    else setError(results[4].reason?.message || "Unable to load vendor payments.");
    setLoading(false);
  };

  // Initial payment snapshot; subsequent refreshes happen after writes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <PageShell
      title="Vendor payments"
      description="Record full or partial payments against product purchases."
      tools={<Button color="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Record payment</Button>}
    >
      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        loading={loading}
        rows={rows}
        columns={[
          { key: "paymentDate", label: "Date", render: (value) => formatDate(value, true) },
          { key: "vendor", label: "Vendor", render: (value) => value?.name || "—" },
          { key: "purchase", label: "Purchase", render: (value) => value?.purchaseCode || "On account" },
          { key: "amount", label: "Amount", render: formatMoney },
          { key: "paymentMethod", label: "Method" },
          { key: "referenceNo", label: "Reference" },
          { key: "branch", label: "Branch", render: (value) => value?.name || "All branches" },
        ]}
      />
      <SchemaModal
        isOpen={open}
        toggle={() => setOpen((value) => !value)}
        title="Record vendor payment"
        submitLabel="Save payment"
        fields={[
          ...(user?.role === "SUPER_ADMIN" ? [{ name: "salonId", label: "Salon", type: "select", required: true, options: refs.salons.map((item) => ({ value: item.id, label: item.name })) }] : []),
          { name: "vendorId", label: "Vendor", type: "select", required: true, options: refs.vendors.map((item) => ({ value: item.id, label: item.name })) },
          { name: "purchaseId", label: "Purchase (optional)", type: "select", nullable: true, options: refs.purchases.filter((item) => Number(item.balanceAmount) > 0).map((item) => ({ value: item.id, label: `${item.purchaseCode} · ${item.vendor?.name || item.supplierName || "Vendor"} · ${formatMoney(item.balanceAmount)}` })) },
          { name: "branchId", label: "Branch", type: "select", nullable: true, options: refs.branches.map((item) => ({ value: item.id, label: item.name })) },
          { name: "amount", label: "Amount", type: "number", min: 0.01, step: "0.01", required: true },
          { name: "paymentDate", label: "Payment date", type: "date", defaultValue: new Date().toISOString().slice(0, 10), required: true },
          { name: "paymentMethod", label: "Payment method", type: "select", defaultValue: "CASH", required: true, options: methods.map((method) => ({ value: method, label: method })) },
          { name: "referenceNo", label: "Reference number", nullable: true },
          { name: "note", label: "Note", type: "textarea", fullWidth: true, nullable: true },
        ]}
        onSubmit={async (values) => {
          await salonApi.vendorPayments.create(values);
          await load();
        }}
      />
    </PageShell>
  );
};

export default VendorPayments;
