/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from "reactstrap";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import ResourcePanel from "@/components/salon/ResourcePanel";
import SchemaModal from "@/components/salon/SchemaModal";
import StatusBadge from "@/components/salon/StatusBadge";
import ServiceConsumablesModal from "@/components/salon/ServiceConsumablesModal";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatMoney, roleCanManage } from "@/utils/salonFormat";

const ServiceCatalog = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("services");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [seedError, setSeedError] = useState("");
  const [consumableService, setConsumableService] = useState(null);
  const [refs, setRefs] = useState({
    salons: [],
    branches: [],
    mainServices: [],
  });
  const canManage = roleCanManage(user?.role);
  const isSuper = user?.role === "SUPER_ADMIN";

  const loadRefs = useCallback(async () => {
    const [salons, branches, categories] = await Promise.allSettled([
      isSuper ? salonApi.salons.list() : Promise.resolve({ data: [] }),
      user?.role === "STAFF"
        ? Promise.resolve({ data: [] })
        : salonApi.branches.list(),
      salonApi.mainServices.list(),
    ]);
    setRefs({
      salons: salons.status === "fulfilled" ? salons.value.data || [] : [],
      branches: branches.status === "fulfilled" ? branches.value.data || [] : [],
      mainServices:
        categories.status === "fulfilled" ? categories.value.data || [] : [],
    });
  }, [isSuper, user?.role]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  const sortedCategories = useMemo(
    () =>
      [...refs.mainServices].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    [refs.mainServices]
  );

  const categoryFields = useMemo(
    () => [
      { name: "name", label: "Category name", required: true },
      ...(isSuper
        ? [
            {
              name: "salonId",
              label: "Salon",
              type: "select",
              required: true,
              options: refs.salons.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            },
          ]
        : []),
      { name: "status", label: "Active", type: "checkbox", defaultValue: true },
    ],
    [isSuper, refs.salons]
  );

  const serviceFields = useMemo(
    () => [
      { name: "name", label: "Service name", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
        nullable: true,
      },
      {
        name: "price",
        label: "Price",
        type: "number",
        min: 0,
        step: "0.01",
        required: true,
      },
      {
        name: "durationValue",
        label: "Duration",
        type: "number",
        min: 1,
        step: 1,
        nullable: true,
        help: "Optional. Enter a positive whole number.",
      },
      {
        name: "durationUnit",
        label: "Duration unit",
        type: "select",
        options: [
          { value: "MINUTES", label: "Minutes" },
          { value: "HOURS", label: "Hours" },
        ],
        defaultValue: "MINUTES",
      },
      {
        name: "mainServiceId",
        label: "Main service",
        type: "select",
        required: true,
        options: refs.mainServices.map((item) => ({
          value: item.id,
          label: `${item.name}${
            isSuper && item.salon?.name ? ` · ${item.salon.name}` : ""
          }`,
        })),
      },
      {
        name: "branchId",
        label: "Branch",
        type: "select",
        nullable: true,
        options: refs.branches.map((item) => ({
          value: item.id,
          label: item.name,
        })),
        help: "Leave empty to make this service available to all branches.",
      },
      ...(isSuper
        ? [
            {
              name: "salonId",
              label: "Salon",
              type: "select",
              required: true,
              options: refs.salons.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            },
          ]
        : []),
      { name: "status", label: "Active", type: "checkbox", defaultValue: true },
    ],
    [isSuper, refs]
  );

  const runSeed = async (values = {}) => {
    setSeeding(true);
    setSeedError("");
    setSeedMessage("");
    try {
      const response = await salonApi.services.seedDefaults(values);
      const result = response.data || {};
      setSeedMessage(
        `Defaults ready: ${result.mainServicesCreated || 0} categories and ${
          result.servicesCreated || 0
        } services created; ${result.skippedExisting || 0} existing services skipped.`
      );
      setSeedOpen(false);
      setCategoryFilter("");
      setRefreshKey((current) => current + 1);
      await loadRefs();
    } catch (error) {
      setSeedError(error.message);
      if (isSuper) throw error;
    } finally {
      setSeeding(false);
    }
  };

  const statusAction = (api) =>
    canManage
      ? (row, reload, setError) => (
          <Button
            size="sm"
            color={row.status ? "warning" : "success"}
            outline
            onClick={async () => {
              try {
                await api.setStatus(row.id, !row.status);
                await reload();
                await loadRefs();
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <Icon name={row.status ? "pause" : "play"} />
            {row.status ? "Deactivate" : "Activate"}
          </Button>
        )
      : undefined;

  const serviceActions = (row, reload, setError) => (
    <>
      <Button
        size="sm"
        color="primary"
        outline
        onClick={() => setConsumableService(row)}
      >
        <Icon name="package-fill" />
        Consumables
      </Button>
      {statusAction(salonApi.services)?.(row, reload, setError)}
    </>
  );

  return (
    <PageShell
      title="Service catalog"
      description="Manage billable services, their main categories, pricing, duration, and branch availability."
      tools={
        canManage ? (
          <Button
            color="success"
            outline
            disabled={seeding}
            onClick={() => (isSuper ? setSeedOpen(true) : runSeed())}
          >
            <Icon name="download-cloud" />
            <span>{seeding ? "Adding defaults…" : "Seed default services"}</span>
          </Button>
        ) : null
      }
    >
      {seedMessage && <Alert color="success">{seedMessage}</Alert>}
      {seedError && <Alert color="danger">{seedError}</Alert>}

      <Nav tabs className="mt-n2 mb-4">
        <NavItem>
          <NavLink
            href="#services"
            active={tab === "services"}
            onClick={(event) => {
              event.preventDefault();
              setTab("services");
            }}
          >
            Services
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            href="#categories"
            active={tab === "categories"}
            onClick={(event) => {
              event.preventDefault();
              setTab("categories");
            }}
          >
            Main services
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={tab}>
        <TabPane tabId="services">
          <Row className="g-4">
            <Col xl="3">
              <div className="card card-bordered service-category-panel">
                <div className="card-inner">
                  <h6 className="title mb-3">Main services</h6>
                  <div className="service-category-list">
                    <button
                      type="button"
                      className={`service-category-item ${
                        categoryFilter === "" ? "active" : ""
                      }`}
                      onClick={() => setCategoryFilter("")}
                    >
                      <span>All services</span>
                    </button>
                    {sortedCategories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        className={`service-category-item ${
                          categoryFilter === category.id ? "active" : ""
                        }`}
                        onClick={() => setCategoryFilter(category.id)}
                      >
                        <span>
                          {category.name}
                          {isSuper && category.salon?.name && (
                            <small>{category.salon.name}</small>
                          )}
                        </span>
                        <span className="badge badge-dim bg-light">
                          {category.services?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
            <Col xl="9">
              <ResourcePanel
                title="Services"
                description={
                  categoryFilter
                    ? `Showing ${
                        refs.mainServices.find(
                          (item) => item.id === categoryFilter
                        )?.name || "selected"
                      } services.`
                    : "Showing services from every main category."
                }
                api={salonApi.services}
                canCreate={canManage}
                canEdit={canManage}
                canDelete={canManage}
                refreshKey={refreshKey}
                filterRows={(rows) =>
                  categoryFilter
                    ? rows.filter(
                        (row) => row.mainServiceId === categoryFilter
                      )
                    : rows
                }
                onChanged={loadRefs}
                columns={[
                  { key: "name", label: "Service name" },
                  {
                    key: "mainService",
                    label: "Main service",
                    render: (value) => value?.name || "—",
                  },
                  { key: "price", label: "Price", render: formatMoney },
                  {
                    key: "durationValue",
                    label: "Duration",
                    render: (value, row) =>
                      value
                        ? `${value} ${row.durationUnit.toLowerCase()}`
                        : "—",
                  },
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
                ]}
                fields={serviceFields}
                transformCreate={(values) => {
                  const createValues = { ...values };
                  delete createValues.status;
                  return createValues;
                }}
                renderActions={serviceActions}
              />
            </Col>
          </Row>
        </TabPane>

        <TabPane tabId="categories">
          <ResourcePanel
            title="Main services"
            description="Main services group related billable services, such as Hair, Skin, and Makeup."
            api={salonApi.mainServices}
            canCreate={canManage}
            canEdit={canManage}
            canDelete={canManage}
            refreshKey={refreshKey}
            onChanged={loadRefs}
            columns={[
              { key: "name", label: "Main service" },
              {
                key: "services",
                label: "Services",
                render: (value) => value?.length || 0,
              },
              {
                key: "salon",
                label: "Salon",
                render: (value) => value?.name || "Current salon",
              },
              {
                key: "status",
                label: "Status",
                render: (value) => <StatusBadge value={value} />,
              },
            ]}
            fields={categoryFields}
            renderActions={statusAction(salonApi.mainServices)}
          />
        </TabPane>
      </TabContent>

      <SchemaModal
        isOpen={seedOpen}
        toggle={() => setSeedOpen(false)}
        title="Seed default salon services"
        submitLabel="Seed defaults"
        fields={[
          {
            name: "salonId",
            label: "Salon",
            type: "select",
            required: true,
            options: refs.salons.map((salon) => ({
              value: salon.id,
              label: salon.name,
            })),
          },
        ]}
        onSubmit={runSeed}
      />
      {consumableService && (
        <ServiceConsumablesModal
          service={consumableService}
          canManage={canManage}
          toggle={() => setConsumableService(null)}
        />
      )}
    </PageShell>
  );
};

export default ServiceCatalog;
