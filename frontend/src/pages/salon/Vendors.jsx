import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import ResourcePanel from "@/components/salon/ResourcePanel";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { roleCanManage } from "@/utils/salonFormat";

const Vendors = () => {
  const { user } = useAuth();
  const canManage = roleCanManage(user?.role);
  const [salons, setSalons] = useState([]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      salonApi.salons.list().then((response) => setSalons(response.data || []));
    }
  }, [user?.role]);

  return (
    <PageShell title="Vendors" description="Manage product suppliers and purchasing contacts.">
      <ResourcePanel
        title="Vendors"
        api={salonApi.vendors}
        canCreate={canManage}
        canEdit={canManage}
        canDelete={canManage}
        fields={[
          { name: "name", label: "Vendor name", required: true },
          { name: "contactPerson", label: "Contact person", nullable: true },
          { name: "email", label: "Email", type: "email", nullable: true },
          { name: "phone", label: "Phone", nullable: true },
          { name: "gst", label: "GST number", nullable: true },
          { name: "paymentTerms", label: "Payment terms", nullable: true },
          { name: "address", label: "Address", type: "textarea", fullWidth: true, nullable: true },
          ...(user?.role === "SUPER_ADMIN"
            ? [{ name: "salonId", label: "Salon", type: "select", required: true, options: salons.map((salon) => ({ value: salon.id, label: salon.name })) }]
            : []),
        ]}
        columns={[
          { key: "name", label: "Vendor" },
          { key: "contactPerson", label: "Contact" },
          { key: "phone", label: "Phone" },
          { key: "paymentTerms", label: "Terms" },
          { key: "_count", label: "Products", render: (value) => value?.products || 0 },
          { key: "status", label: "Status", render: (value) => <StatusBadge value={value} /> },
        ]}
        transformUpdate={(values) => {
          const next = { ...values };
          delete next.salonId;
          return next;
        }}
        renderActions={canManage ? (row, reload, setError) => (
          <Button size="sm" color={row.status ? "warning" : "success"} outline onClick={async () => {
            try {
              await salonApi.vendors.setStatus(row.id, !row.status);
              await reload();
            } catch (error) {
              setError(error.message);
            }
          }}>
            <Icon name={row.status ? "pause" : "play"} />
            {row.status ? "Deactivate" : "Activate"}
          </Button>
        ) : undefined}
      />
    </PageShell>
  );
};

export default Vendors;
