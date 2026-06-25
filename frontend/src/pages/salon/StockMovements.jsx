/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Alert, Col, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { Button, Icon } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import SchemaModal from "@/components/salon/SchemaModal";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatDate, roleCanManage } from "@/utils/salonFormat";

const movementTypes = ["STOCK_IN", "STOCK_OUT", "USED_IN_SERVICE", "DAMAGED", "ADJUSTMENT", "RETURNED"];

const StockMovements = () => {
  const { user } = useAuth();
  const canManage = roleCanManage(user?.role);
  const [tab, setTab] = useState("movements");
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [filters, setFilters] = useState({ productId: "", type: "", from: "", to: "" });
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [productResult, movementResult, lowResult] = await Promise.all([
        salonApi.products.list(),
        salonApi.stockMovements.list(filters),
        salonApi.products.lowStock(),
      ]);
      setProducts(productResult.data || []);
      setMovements(movementResult.data || []);
      setLowStock(lowResult.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial inventory snapshot; filters are applied explicitly by the user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <PageShell
      title="Low stock / stock movements"
      description="Audit every inventory change and quickly spot products that need replenishment."
      tools={canManage ? <Button color="primary" onClick={() => setManualOpen(true)}><Icon name="plus" /> Manual movement</Button> : null}
    >
      {error && <Alert color="danger">{error}</Alert>}
      <Nav tabs className="mb-4">
        <NavItem><NavLink href="#movements" active={tab === "movements"} onClick={(e) => { e.preventDefault(); setTab("movements"); }}>Stock movements</NavLink></NavItem>
        <NavItem><NavLink href="#low-stock" active={tab === "low"} onClick={(e) => { e.preventDefault(); setTab("low"); }}>Low stock <span className="badge bg-danger ms-1">{lowStock.length}</span></NavLink></NavItem>
      </Nav>
      <TabContent activeTab={tab}>
        <TabPane tabId="movements">
          <div className="card card-bordered mb-4">
            <div className="card-inner">
              <Row className="g-3 align-items-end">
                <Col md="3"><Label>Product</Label><Input type="select" value={filters.productId} onChange={(e) => setFilters((x) => ({ ...x, productId: e.target.value }))}><option value="">All products</option>{products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Input></Col>
                <Col md="3"><Label>Type</Label><Input type="select" value={filters.type} onChange={(e) => setFilters((x) => ({ ...x, type: e.target.value }))}><option value="">All types</option>{[...movementTypes, "RETAIL_SALE"].map((x) => <option key={x}>{x}</option>)}</Input></Col>
                <Col md="2"><Label>From</Label><Input type="date" value={filters.from} onChange={(e) => setFilters((x) => ({ ...x, from: e.target.value }))} /></Col>
                <Col md="2"><Label>To</Label><Input type="date" value={filters.to} onChange={(e) => setFilters((x) => ({ ...x, to: e.target.value ? `${e.target.value}T23:59:59.999Z` : "" }))} /></Col>
                <Col md="2"><Button color="primary" outline onClick={load}>Apply filters</Button></Col>
              </Row>
            </div>
          </div>
          <DataGrid
            loading={loading}
            rows={movements}
            columns={[
              { key: "createdAt", label: "Date", render: (v) => formatDate(v, true) },
              { key: "product", label: "Product", render: (v) => v?.name || "—" },
              { key: "type", label: "Type", render: (v) => <StatusBadge value={v} /> },
              { key: "quantity", label: "Quantity" },
              { key: "stockBefore", label: "Before" },
              { key: "stockAfter", label: "After" },
              { key: "reason", label: "Reason" },
            ]}
          />
        </TabPane>
        <TabPane tabId="low">
          <DataGrid
            loading={loading}
            rows={lowStock}
            emptyText="No low-stock products. Nicely stocked."
            columns={[
              { key: "name", label: "Product" },
              { key: "brand", label: "Brand", render: (v) => v?.name || "Generic" },
              { key: "branch", label: "Branch", render: (v) => v?.name || "All branches" },
              { key: "currentStock", label: "Current stock" },
              { key: "lowStockAlert", label: "Alert at" },
              { key: "unit", label: "Unit" },
            ]}
          />
        </TabPane>
      </TabContent>
      <SchemaModal
        isOpen={manualOpen}
        toggle={() => setManualOpen(false)}
        title="Manual stock movement"
        submitLabel="Update stock"
        fields={[
          { name: "productId", label: "Product", type: "select", required: true, options: products.map((x) => ({ value: x.id, label: `${x.name} (${x.currentStock} ${x.unit})` })) },
          { name: "type", label: "Movement type", type: "select", required: true, defaultValue: "ADJUSTMENT", options: movementTypes.map((x) => ({ value: x, label: x })) },
          { name: "quantity", label: "Quantity", type: "number", step: "0.01", required: true, help: "Use a negative value only for ADJUSTMENT." },
          { name: "reason", label: "Reason", required: true },
          { name: "note", label: "Note", type: "textarea", fullWidth: true, nullable: true },
        ]}
        onSubmit={async (values) => {
          await salonApi.stockMovements.createManual(values);
          await load();
        }}
      />
    </PageShell>
  );
};

export default StockMovements;
