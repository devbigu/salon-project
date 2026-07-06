import ResourcePanel from "@/components/salon/ResourcePanel";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { salonApi } from "@/services/salonApi";
import { formatDate } from "@/utils/salonFormat";
import { Button } from "@/components/Component";
import { useAuth } from "@/auth/AuthContext";

const Memberships = () => {
 const { user } = useAuth(); const manage = ["SUPER_ADMIN","SALON_ADMIN"].includes(user?.role);
 return (
  <PageShell title="Memberships" description="Create customer membership tiers and control their invoice discount.">
    <ResourcePanel
      title="Memberships"
      api={salonApi.memberships}
      canCreate={manage} canEdit={manage} canDelete={manage}
      renderActions={manage ? (row, reload) => <Button size="sm" color={row.status ? "warning" : "success"} outline onClick={async () => { await salonApi.memberships.setStatus(row.id, !row.status); await reload(); }}>{row.status ? "Deactivate" : "Activate"}</Button> : undefined}
      columns={[
        { key: "name", label: "Membership" },
        { key: "description", label: "Description" },
        { key: "discountPercentage", label: "Discount", render: (v) => `${Number(v)}%` },
        { key: "_count", label: "Active customers", render: (v) => (v?.customerMemberships || 0) + (v?.customers || 0) },
        { key: "status", label: "Status", render: (v) => <StatusBadge value={v ? "ACTIVE" : "INACTIVE"} /> },
        { key: "createdAt", label: "Created", render: formatDate },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "discountPercentage", label: "Discount percentage", type: "number", min: 0, max: 100, step: "0.01", required: true },
        { name: "description", label: "Description", type: "textarea", fullWidth: true, nullable: true },
      ]}
    />
  </PageShell>
 );};
export default Memberships;
