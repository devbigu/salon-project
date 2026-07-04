import { useEffect, useState } from "react";
import { Alert, Col, Row, Spinner } from "reactstrap";
import PageShell from "@/components/salon/PageShell";
import { salonApi } from "@/services/salonApi";
import { formatMoney } from "@/utils/salonFormat";
import ReportExportButtons from "@/components/salon/ReportExportButtons";

const InventoryReport = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    salonApi.reports.inventory()
      .then((response) => setData(response.data))
      .catch((loadError) => setError(loadError.message));
  }, []);
  const metrics = data ? [
    ["Total products", data.totalProducts],
    ["Stock quantity", data.totalStockQuantity],
    ["Stock cost value", formatMoney(data.totalStockCostValue)],
    ["Potential retail value", formatMoney(data.totalRetailValue)],
    ["Low-stock products", data.lowStockCount],
  ] : [];
  return (
    <PageShell title="Inventory report" description="A live valuation and stock-health snapshot."
      tools={<ReportExportButtons reportType="inventory" />}>
      {error && <Alert color="danger">{error}</Alert>}
      {!data && !error ? <Spinner color="primary" /> : (
        <Row className="g-4">
          {metrics.map(([label, value]) => <Col md="4" key={label}><div className="card card-bordered h-100"><div className="card-inner"><div className="text-soft mb-2">{label}</div><h3 className="mb-0">{value}</h3></div></div></Col>)}
        </Row>
      )}
    </PageShell>
  );
};

export default InventoryReport;
