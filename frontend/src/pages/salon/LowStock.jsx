import { useEffect, useState } from "react";
import { Alert } from "reactstrap";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import { salonApi } from "@/services/salonApi";
import { Link } from "react-router-dom";
import { Button, Icon } from "@/components/Component";

const LowStock = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    salonApi.products.lowStock()
      .then((response) => setRows(response.data || []))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      title="Low stock"
      description="Active products at or below their configured replenishment threshold."
      tools={
        <>
          <Button
            tag={Link}
            to="/inventory/stock-alerts"
            color="primary"
            outline
          >
            <Icon name="alert-circle" />
            View Stock Alerts
          </Button>
          <Button
            tag={Link}
            to="/inventory/reorder-suggestions"
            color="primary"
          >
            <Icon name="cart" />
            View Reorder Suggestions
          </Button>
        </>
      }
    >
      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        loading={loading}
        rows={rows}
        emptyText="No products currently need replenishment."
        columns={[
          { key: "name", label: "Product" },
          { key: "brand", label: "Brand", render: (value) => value?.name || "Generic" },
          { key: "vendor", label: "Vendor", render: (value) => value?.name || "—" },
          { key: "currentStock", label: "Current stock" },
          { key: "lowStockAlert", label: "Alert level" },
          { key: "requiredQuantity", label: "Required quantity" },
          { key: "branch", label: "Branch", render: (value) => value?.name || "All branches" },
        ]}
      />
    </PageShell>
  );
};

export default LowStock;
