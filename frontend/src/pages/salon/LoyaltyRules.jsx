import ResourcePanel from "@/components/salon/ResourcePanel";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { salonApi } from "@/services/salonApi";
import { formatDate, formatMoney } from "@/utils/salonFormat";
import { Button } from "@/components/Component";
import { useAuth } from "@/auth/AuthContext";

const fields = [
  { name: "earnAmountStep", label: "Paid amount step", type: "number", min: 0.01, step: "0.01", required: true },
  { name: "earnPointsPerAmount", label: "Points earned per step", type: "number", min: 0, step: "0.01", required: true },
  { name: "redeemValuePerPoint", label: "Discount value per point", type: "number", min: 0, step: "0.01", required: true },
  { name: "minRedeemPoints", label: "Minimum redeem points", type: "number", min: 0, step: 1, required: true },
  { name: "maxRedeemPoints", label: "Maximum redeem points", type: "number", min: 0, step: 1, nullable: true },
];
const LoyaltyRules = () => {
 const { user } = useAuth(); const manage = ["SUPER_ADMIN","SALON_ADMIN"].includes(user?.role);
 return (
  <PageShell title="Loyalty rules" description="Configure how paid invoices earn points and how points become discounts.">
    <ResourcePanel title="Loyalty rules" api={salonApi.loyaltyRules} canCreate={manage} canEdit={manage} canDelete={false} fields={fields}
      renderActions={manage ? (row, reload) => <Button size="sm" color={row.status ? "warning" : "success"} outline onClick={async () => { await salonApi.loyaltyRules.setStatus(row.id, !row.status); await reload(); }}>{row.status ? "Deactivate" : "Activate"}</Button> : undefined}
      columns={[
        { key: "earnAmountStep", label: "Earning", render: (v, r) => `${formatMoney(v)} paid = ${Number(r.earnPointsPerAmount)} point(s)` },
        { key: "redeemValuePerPoint", label: "Redemption", render: (v) => `1 point = ${formatMoney(v)} discount` },
        { key: "minRedeemPoints", label: "Minimum" },
        { key: "maxRedeemPoints", label: "Maximum", render: (v) => v ?? "No limit" },
        { key: "status", label: "Status", render: (v) => <StatusBadge value={v ? "ACTIVE" : "INACTIVE"} /> },
        { key: "createdAt", label: "Created", render: formatDate },
      ]} />
  </PageShell>
 );};
export default LoyaltyRules;
