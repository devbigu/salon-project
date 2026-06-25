import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import ResourcePanel from "@/components/salon/ResourcePanel";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { roleCanManage } from "@/utils/salonFormat";

const ProductBrands = () => {
  const { user } = useAuth();
  const canManage = roleCanManage(user?.role);
  const [salons, setSalons] = useState([]);
  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      salonApi.salons.list().then((response) => setSalons(response.data || []));
    }
  }, [user?.role]);
  return (
    <PageShell title="Product brands" description="Manage the brands used across your salon inventory.">
      <ResourcePanel
        title="Product brands"
        api={salonApi.productBrands}
        canCreate={canManage}
        canEdit={canManage}
        canDelete={canManage}
        columns={[
          { key: "name", label: "Brand" },
          { key: "description", label: "Description" },
          { key: "_count", label: "Products", render: (value) => value?.products || 0 },
          { key: "status", label: "Status", render: (value) => <StatusBadge value={value} /> },
        ]}
        fields={[
          { name: "name", label: "Brand name", required: true },
          { name: "description", label: "Description", type: "textarea", fullWidth: true, nullable: true },
          ...(user?.role === "SUPER_ADMIN"
            ? [{ name: "salonId", label: "Salon", type: "select", required: true, options: salons.map((salon) => ({ value: salon.id, label: salon.name })) }]
            : []),
        ]}
        transformUpdate={(values) => {
          const next = { ...values };
          delete next.salonId;
          return next;
        }}
        renderActions={canManage ? (row, reload, setError) => (
          <Button
            size="sm"
            color={row.status ? "warning" : "success"}
            outline
            onClick={async () => {
              try {
                await salonApi.productBrands.setStatus(row.id, !row.status);
                await reload();
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <Icon name={row.status ? "pause" : "play"} />
            {row.status ? "Deactivate" : "Activate"}
          </Button>
        ) : undefined}
      />
    </PageShell>
  );
};

export default ProductBrands;
