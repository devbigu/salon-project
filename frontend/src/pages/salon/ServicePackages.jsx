/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Alert, Input } from "reactstrap";
import ResourcePanel from "@/components/salon/ResourcePanel";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { Button } from "@/components/Component";
import { salonApi } from "@/services/salonApi";
import { formatMoney } from "@/utils/salonFormat";
import { useAuth } from "@/auth/AuthContext";

const packageApi = {
  ...salonApi.packages,
  list: () => salonApi.packages.list({ page: 1, limit: 100 }),
};

const ServicePackages = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const manage = ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"].includes(
    user?.role
  );

  useEffect(() => {
    Promise.all([
      salonApi.packageCategories.list({ page: 1, limit: 100 }),
      salonApi.services.list(),
    ])
      .then(([categoryResponse, serviceResponse]) => {
        setCategories(categoryResponse.data || []);
        setServices(serviceResponse.data || []);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const serviceOptions = useMemo(
    () =>
      services
        .filter((service) => service.status)
        .map((service) => ({
          value: service.id,
          label: `${service.name} — ${formatMoney(service.price)}`,
        })),
    [services]
  );
  const fields = [
    { name: "name", label: "Package name", required: true },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      required: true,
      options: categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    },
    {
      name: "serviceIds",
      initialName: "items",
      fromInitial: (items) =>
        Array.isArray(items) ? items.map((item) => item.serviceId) : [],
      label: "Services",
      type: "multiselect",
      required: true,
      options: serviceOptions,
      help: "The regular total is calculated automatically from current service prices.",
    },
    {
      name: "specialPrice",
      label: "Special price",
      type: "number",
      min: 0,
      step: "0.01",
      required: true,
    },
    {
      name: "calculatedTotal",
      label: "Regular total (auto-calculated)",
      type: "number",
      readOnly: true,
      derive: (values) =>
        (values.serviceIds || []).reduce((total, serviceId) => {
          const service = services.find((item) => item.id === serviceId);
          return total + Number(service?.price || 0);
        }, 0),
    },
    {
      name: "validityDays",
      label: "Validity (days)",
      type: "number",
      min: 1,
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      fullWidth: true,
      nullable: true,
    },
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
  ];

  const transform = (values) => ({
    ...values,
    serviceIds: (values.serviceIds || []).map((value) =>
      typeof value === "string" ? value : value.serviceId
    ),
  });

  return (
    <PageShell
      title="Packages"
      description="Bundle existing services at a special prepaid price."
    >
      {error && <Alert color="danger">{error}</Alert>}
      <div className="mb-3" style={{ maxWidth: 360 }}>
        <Input
          type="search"
          placeholder="Search packages"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <ResourcePanel
        title="Packages"
        api={packageApi}
        pageSize={10}
        fields={fields}
        canCreate={manage}
        canEdit={manage}
        canDelete={manage}
        transformCreate={transform}
        transformUpdate={transform}
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
                    await salonApi.packages.setStatus(
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
          { key: "name", label: "Package" },
          {
            key: "category",
            label: "Category",
            render: (value) => value?.name,
          },
          {
            key: "items",
            label: "Services",
            render: (items) =>
              (items || [])
                .map((item) => `${item.serviceNameSnapshot} × ${item.quantity}`)
                .join(", "),
          },
          { key: "totalPrice", label: "Regular", render: formatMoney },
          { key: "specialPrice", label: "Special", render: formatMoney },
          {
            key: "validityDays",
            label: "Validity",
            render: (value) => `${value} days`,
          },
          {
            key: "status",
            label: "Status",
            render: (value) => <StatusBadge value={value} />,
          },
        ]}
      />
    </PageShell>
  );
};

export default ServicePackages;
