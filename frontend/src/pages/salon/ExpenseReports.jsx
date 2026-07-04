/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Alert, Col, Input, Label, Row } from "reactstrap";
import { Button } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import { salonApi } from "@/services/salonApi";
import { formatMoney } from "@/utils/salonFormat";
import ReportExportButtons from "@/components/salon/ReportExportButtons";

const ExpenseReports = () => {
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.reports.expenses({
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

  // Load the initial unfiltered report; filters are applied explicitly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <PageShell title="Expense reports" description="Expense totals grouped by category, month, and branch."
      tools={<ReportExportButtons reportType="expenses" filters={filters} />}>
      {error && <Alert color="danger">{error}</Alert>}
      <div className="card card-bordered mb-4"><div className="card-inner"><Row className="g-3 align-items-end">
        <Col md="4"><Label>From</Label><Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></Col>
        <Col md="4"><Label>To</Label><Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></Col>
        <Col md="4"><Button color="primary" outline onClick={load}>Apply dates</Button></Col>
      </Row></div></div>
      <div className="card card-bordered mb-4"><div className="card-inner"><div className="text-soft">Total expenses</div><h2>{formatMoney(data?.totalExpenses)}</h2></div></div>
      <Row className="g-4">
        <Col lg="4"><h5>By category</h5><DataGrid loading={loading} rows={(data?.expensesByCategory || []).map((row) => ({ ...row, id: row.category }))} columns={[{ key: "category", label: "Category" }, { key: "total", label: "Total", render: formatMoney }]} /></Col>
        <Col lg="4"><h5>By month</h5><DataGrid loading={loading} rows={(data?.expensesByMonth || []).map((row) => ({ ...row, id: row.month }))} columns={[{ key: "month", label: "Month" }, { key: "total", label: "Total", render: formatMoney }]} /></Col>
        <Col lg="4"><h5>By branch</h5><DataGrid loading={loading} rows={(data?.expensesByBranch || []).map((row, index) => ({ ...row, id: row.branchId || `global-${index}` }))} columns={[{ key: "branch", label: "Branch" }, { key: "total", label: "Total", render: formatMoney }]} /></Col>
      </Row>
    </PageShell>
  );
};

export default ExpenseReports;
