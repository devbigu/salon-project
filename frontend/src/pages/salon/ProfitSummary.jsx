/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Alert, Col, Input, Label, Row, Spinner } from "reactstrap";
import { Button } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import { salonApi } from "@/services/salonApi";
import { formatMoney } from "@/utils/salonFormat";
import ReportExportButtons from "@/components/salon/ReportExportButtons";

const ProfitSummary = () => {
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.reports.profitSummary({
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      });
      setData(response.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };
  // Load the initial unfiltered summary; filters are applied explicitly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const metrics = data ? [
    ["Service payments", data.serviceRevenue],
    ["Sale revenue", data.saleRevenue],
    ["Retail sales", data.retailSalesTotal],
    ["Product purchases", -data.productPurchaseCost],
    ["Other expenses", -data.expensesTotal],
  ] : [];

  return (
    <PageShell title="Profit summary" description="Estimated revenue less product purchases and recorded expenses. Salary is intentionally excluded."
      tools={<ReportExportButtons reportType="profit-summary" filters={filters} />}>
      {error && <Alert color="danger">{error}</Alert>}
      <div className="card card-bordered mb-4"><div className="card-inner"><Row className="g-3 align-items-end">
        <Col md="4"><Label>From</Label><Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></Col>
        <Col md="4"><Label>To</Label><Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></Col>
        <Col md="4"><Button color="primary" outline onClick={load}>Apply dates</Button></Col>
      </Row></div></div>
      {loading ? <Spinner color="primary" /> : data && <>
        <Row className="g-4 mb-4">{metrics.map(([label, value]) => <Col md="4" key={label}><div className="card card-bordered h-100"><div className="card-inner"><div className="text-soft mb-2">{label}</div><h4 className={value < 0 ? "text-danger" : "text-success"}>{formatMoney(value)}</h4></div></div></Col>)}</Row>
        <div className="card card-bordered"><div className="card-inner"><div className="text-soft">Estimated profit</div><h2 className={data.estimatedProfit < 0 ? "text-danger" : "text-success"}>{formatMoney(data.estimatedProfit)}</h2></div></div>
      </>}
    </PageShell>
  );
};

export default ProfitSummary;
