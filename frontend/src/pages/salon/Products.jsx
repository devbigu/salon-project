import { useEffect, useMemo, useState } from "react";
import { Col, Input, Label, Row } from "reactstrap";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import ResourcePanel from "@/components/salon/ResourcePanel";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatMoney, roleCanManage } from "@/utils/salonFormat";

const units = ["PCS", "ML", "LITER", "GRAM", "KG", "PACK", "BOX", "BOTTLE", "TUBE"];

const Products = () => {
  const { user } = useAuth();
  const canManage = roleCanManage(user?.role);
  const [refs, setRefs] = useState({ brands: [], branches: [], salons: [] });
  const [filters, setFilters] = useState({ brand: "", status: "", low: false });

  useEffect(() => {
    Promise.allSettled([
      salonApi.productBrands.list(),
      user?.role === "STAFF" ? Promise.resolve({ data: [] }) : salonApi.branches.list(),
      user?.role === "SUPER_ADMIN" ? salonApi.salons.list() : Promise.resolve({ data: [] }),
    ]).then(([brands, branches, salons]) => setRefs({
      brands: brands.status === "fulfilled" ? brands.value.data || [] : [],
      branches: branches.status === "fulfilled" ? branches.value.data || [] : [],
      salons: salons.status === "fulfilled" ? salons.value.data || [] : [],
    }));
  }, [user?.role]);

  const fields = useMemo(() => [
    { name: "name", label: "Product name", required: true },
    { name: "description", label: "Description", type: "textarea", fullWidth: true, nullable: true },
    { name: "brandId", label: "Brand", type: "select", nullable: true, options: refs.brands.map((x) => ({ value: x.id, label: x.name })) },
    { name: "category", label: "Category", nullable: true },
    { name: "sku", label: "SKU", nullable: true },
    { name: "barcode", label: "Barcode", nullable: true },
    { name: "unit", label: "Unit", type: "select", defaultValue: "PCS", options: units.map((x) => ({ value: x, label: x })) },
    { name: "costPrice", label: "Cost price", type: "number", min: 0, step: "0.01", defaultValue: 0, required: true },
    { name: "sellingPrice", label: "Selling price", type: "number", min: 0, step: "0.01", defaultValue: 0, required: true },
    { name: "lowStockAlert", label: "Low stock alert", type: "number", min: 0, step: "0.01", defaultValue: 0, required: true },
    { name: "branchId", label: "Branch", type: "select", nullable: true, options: refs.branches.map((x) => ({ value: x.id, label: x.name })), help: "Leave empty for all branches." },
    ...(user?.role === "SUPER_ADMIN" ? [{ name: "salonId", label: "Salon", type: "select", required: true, options: refs.salons.map((x) => ({ value: x.id, label: x.name })) }] : []),
    { name: "isRetailProduct", label: "Retail product", type: "checkbox", defaultValue: false },
  ], [refs, user?.role]);

  return (
    <PageShell title="Products" description="Product catalog, pricing, branch availability, and live stock.">
      <div className="card card-bordered mb-4">
        <div className="card-inner">
          <Row className="g-3 align-items-end">
            <Col md="4"><Label>Brand</Label><Input type="select" value={filters.brand} onChange={(e) => setFilters((x) => ({ ...x, brand: e.target.value }))}><option value="">All brands</option>{refs.brands.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Input></Col>
            <Col md="4"><Label>Status</Label><Input type="select" value={filters.status} onChange={(e) => setFilters((x) => ({ ...x, status: e.target.value }))}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Input></Col>
            <Col md="4"><Label className="d-block">Stock</Label><Input type="checkbox" checked={filters.low} onChange={(e) => setFilters((x) => ({ ...x, low: e.target.checked }))} /> <span className="ms-2">Low stock only</span></Col>
          </Row>
        </div>
      </div>
      <ResourcePanel
        title="Products"
        api={salonApi.products}
        canCreate={canManage}
        canEdit={canManage}
        canDelete={canManage}
        fields={fields}
        filterRows={(rows) => rows.filter((row) =>
          (!filters.brand || row.brandId === filters.brand) &&
          (!filters.status || row.status === (filters.status === "active")) &&
          (!filters.low || Number(row.currentStock) <= Number(row.lowStockAlert))
        )}
        columns={[
          { key: "name", label: "Product" },
          { key: "brand", label: "Brand", render: (v) => v?.name || "Generic" },
          { key: "category", label: "Category" },
          { key: "sellingPrice", label: "Retail price", render: formatMoney },
          { key: "currentStock", label: "Stock", render: (v, row) => <span className={Number(v) <= Number(row.lowStockAlert) ? "badge bg-danger" : ""}>{v} {row.unit}</span> },
          { key: "branch", label: "Branch", render: (v) => v?.name || "All branches" },
          { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
        ]}
        transformCreate={(values) => values}
        transformUpdate={(values) => {
          const next = { ...values };
          delete next.salonId;
          return next;
        }}
        renderActions={canManage ? (row, reload, setError) => (
          <Button size="sm" color={row.status ? "warning" : "success"} outline onClick={async () => {
            try { await salonApi.products.setStatus(row.id, !row.status); await reload(); }
            catch (error) { setError(error.message); }
          }}><Icon name={row.status ? "pause" : "play"} />{row.status ? "Deactivate" : "Activate"}</Button>
        ) : undefined}
      />
    </PageShell>
  );
};

export default Products;
