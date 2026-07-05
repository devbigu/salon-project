import { useState } from "react";
import { Input } from "reactstrap";
import ResourcePanel from "@/components/salon/ResourcePanel";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { Button } from "@/components/Component";
import { salonApi } from "@/services/salonApi";
import { formatDate } from "@/utils/salonFormat";
import { useAuth } from "@/auth/AuthContext";

const categoryApi = {
  ...salonApi.packageCategories,
  list: () => salonApi.packageCategories.list({ page: 1, limit: 100 }),
};

const PackageCategories = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const manage = ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"].includes(
    user?.role
  );
  return (
    <PageShell
      title="Package Categories"
      description="Group service packages into customer-friendly categories."
    >
      <div className="mb-3" style={{ maxWidth: 360 }}>
        <Input
          type="search"
          placeholder="Search package categories"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <ResourcePanel
        title="Package Categories"
        api={categoryApi}
        pageSize={10}
        canCreate={manage}
        canEdit={manage}
        canDelete={manage}
        filterRows={(rows) =>
          rows.filter((row) =>
            row.name.toLowerCase().includes(search.trim().toLowerCase())
          )
        }
        renderActions={
          manage
            ? (row, reload) => (
                <Button
                  size="sm"
                  color={row.status === "ACTIVE" ? "warning" : "success"}
                  outline
                  onClick={async () => {
                    await salonApi.packageCategories.setStatus(
                      row.id,
                      row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                    );
                    await reload();
                  }}
                >
                  {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              )
            : undefined
        }
        columns={[
          { key: "name", label: "Category" },
          {
            key: "_count",
            label: "Packages",
            render: (value) => value?.packages || 0,
          },
          {
            key: "status",
            label: "Status",
            render: (value) => <StatusBadge value={value} />,
          },
          { key: "createdAt", label: "Created", render: formatDate },
        ]}
        fields={[
          { name: "name", label: "Category name", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            defaultValue: "ACTIVE",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
        ]}
      />
    </PageShell>
  );
};

export default PackageCategories;
