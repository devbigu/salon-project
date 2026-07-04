/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Offcanvas,
  OffcanvasBody,
  OffcanvasHeader,
  Row,
  Spinner,
} from "reactstrap";
import { Button, Icon } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { compactId, formatDate, formatMoney } from "@/utils/salonFormat";

const methods = ["CASH", "UPI", "GPAY", "PAYTM", "PHONEPE", "CARD", "BANK_TRANSFER", "CHEQUE", "OTHER"];
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({
  salonId: "",
  branchId: "",
  vendorId: "",
  categoryDefinitionId: "",
  title: "",
  amount: "",
  expenseDate: today(),
  paymentMethod: "CASH",
  description: "",
  note: "",
});

const downloadCsv = (rows) => {
  const content = [
    ["ID", "Name", "Expense Category", "Date", "Payment", "Amount", "Branch"],
    ...rows.map((row) => [
      row.expenseCode || row.id,
      row.title,
      row.category,
      row.expenseDate,
      row.paymentMethod || "",
      row.amount,
      row.branch?.name || "All branches",
    ]),
  ]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "expenses.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

const Expenses = () => {
  const { user } = useAuth();
  const [refs, setRefs] = useState({ categories: [], vendors: [], branches: [], salons: [] });
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", paymentMethod: "", categoryDefinitionId: "", search: "" });
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categories, vendors, branches, salons, expenses] = await Promise.all([
        salonApi.expenseCategories.list(),
        salonApi.vendors.list(),
        salonApi.branches.list(),
        user?.role === "SUPER_ADMIN" ? salonApi.salons.list() : Promise.resolve({ data: [] }),
        salonApi.expenses.list(),
      ]);
      setRefs({
        categories: categories.data || [],
        vendors: vendors.data || [],
        branches: branches.data || [],
        salons: salons.data || [],
      });
      setRows(expenses.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.role]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    const expenseDate = String(row.expenseDate || "").slice(0, 10);
    const term = filters.search.trim().toLowerCase();
    return (
      (!filters.from || expenseDate >= filters.from) &&
      (!filters.to || expenseDate <= filters.to) &&
      (!filters.paymentMethod || row.paymentMethod === filters.paymentMethod) &&
      (!filters.categoryDefinitionId || row.categoryDefinitionId === filters.categoryDefinitionId) &&
      (!term ||
        row.title.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term) ||
        String(row.expenseCode || "").toLowerCase().includes(term))
    );
  }), [rows, filters]);

  useEffect(() => { setPage(1); }, [filters]);

  const totalPages = Math.max(Math.ceil(visibleRows.length / pageSize), 1);
  const pageRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  const totalExpenses = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const monthKey = today().slice(0, 7);
  const monthExpenses = rows
    .filter((row) => String(row.expenseDate || "").startsWith(monthKey))
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const activeCategories = refs.categories.filter((category) => category.status).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      salonId: row.salonId || "",
      branchId: row.branchId || "",
      vendorId: row.vendorId || "",
      categoryDefinitionId: row.categoryDefinitionId || "",
      title: row.title || "",
      amount: Number(row.amount || 0),
      expenseDate: String(row.expenseDate || "").slice(0, 10),
      paymentMethod: row.paymentMethod || "",
      description: row.description || "",
      note: row.note || "",
    });
    setDrawerOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      categoryDefinitionId: form.categoryDefinitionId,
      amount: Number(form.amount),
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod || null,
      branchId: form.branchId || null,
      vendorId: form.vendorId || null,
      description: form.description || null,
      note: form.note || null,
      ...(!editing && form.salonId ? { salonId: form.salonId } : {}),
    };
    try {
      if (editing) await salonApi.expenses.update(editing.id, payload);
      else await salonApi.expenses.create(payload);
      setDrawerOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.title}?`)) return;
    try {
      await salonApi.expenses.remove(row.id);
      await load();
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const resetFilters = () => setFilters({ from: "", to: "", paymentMethod: "", categoryDefinitionId: "", search: "" });

  return (
    <PageShell
      title="Expenses"
      description="Track operational spending by category, payment method, vendor, and branch."
      tools={(
        <>
          <Button color="light" outline onClick={() => downloadCsv(visibleRows)}>
            <Icon name="download-cloud" /> Export
          </Button>
          <Button color="primary" className="btn-icon" onClick={openCreate} title="Add expense">
            <Icon name="plus" />
          </Button>
        </>
      )}
    >
      {error && <Alert color="danger">{error}</Alert>}

      <Row className="g-4 mb-4">
        <Col md="4">
          <div className="card card-bordered h-100" style={{ background: "#e5fbf4" }}>
            <div className="card-inner text-center py-4">
              <h5>Total Expenses</h5><div className="fs-5 text-soft">{formatMoney(totalExpenses)}</div>
            </div>
          </div>
        </Col>
        <Col md="4">
          <div className="card card-bordered h-100" style={{ background: "#fff0ed" }}>
            <div className="card-inner text-center py-4">
              <h5>This Month</h5><div className="fs-5 text-soft">{formatMoney(monthExpenses)}</div>
            </div>
          </div>
        </Col>
        <Col md="4">
          <div className="card card-bordered h-100" style={{ background: "#edf4fc" }}>
            <div className="card-inner text-center py-4">
              <h5>Active Categories</h5><div className="fs-5 text-soft">{activeCategories}</div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h4 className="mb-0">Expense List</h4>
        <div className="text-soft">{visibleRows.length} records</div>
      </div>
      <div className="card card-bordered mb-4">
        <div className="card-inner">
          <Row className="g-3 align-items-end">
            <Col md="2"><Label>Start Date</Label><Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></Col>
            <Col md="2"><Label>End Date</Label><Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></Col>
            <Col md="2"><Label>Payment</Label><Input type="select" value={filters.paymentMethod} onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}><option value="">All payments</option>{methods.map((method) => <option key={method}>{method}</option>)}</Input></Col>
            <Col md="2"><Label>Category</Label><Input type="select" value={filters.categoryDefinitionId} onChange={(event) => setFilters((current) => ({ ...current, categoryDefinitionId: event.target.value }))}><option value="">All categories</option>{refs.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Input></Col>
            <Col md="2"><Label>Search</Label><Input placeholder="Name or ID" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></Col>
            <Col md="2" className="d-flex gap-2"><Button color="warning" onClick={resetFilters}>Reset</Button><Button color="primary" outline onClick={() => downloadCsv(visibleRows)}><Icon name="file-xls" /></Button></Col>
          </Row>
        </div>
      </div>

      <DataGrid
        loading={loading}
        rows={pageRows}
        columns={[
          { key: "expenseCode", label: "Expense ID", render: (value, row) => value || compactId(row.id) },
          { key: "title", label: "Name" },
          { key: "category", label: "Expense Category" },
          { key: "expenseDate", label: "Date", render: (value) => formatDate(value) },
          { key: "paymentMethod", label: "Payment" },
          { key: "amount", label: "Amount", render: formatMoney },
          { key: "branch", label: "Branch", render: (value) => value?.name || "All branches" },
        ]}
        onEdit={openEdit}
        onDelete={remove}
      />
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="btn-group">
          <Button color="light" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</Button>
          <Button color="light" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
        <div className="text-soft">Page {page} of {totalPages}</div>
      </div>

      <Offcanvas isOpen={drawerOpen} toggle={() => setDrawerOpen((open) => !open)} direction="end" style={{ width: 460 }}>
        <OffcanvasHeader toggle={() => setDrawerOpen(false)}>{editing ? "Edit Expense" : "Add Expense"}</OffcanvasHeader>
        <OffcanvasBody>
          <Form onSubmit={save}>
            {user?.role === "SUPER_ADMIN" && !editing && <FormGroup><Label>Salon</Label><Input type="select" required value={form.salonId} onChange={(event) => setForm((current) => ({ ...current, salonId: event.target.value }))}><option value="">Select salon</option>{refs.salons.map((salon) => <option key={salon.id} value={salon.id}>{salon.name}</option>)}</Input></FormGroup>}
            <FormGroup><Label>Expense Name</Label><Input required placeholder="Name" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></FormGroup>
            <FormGroup><Label>Expense Category</Label><Input type="select" required value={form.categoryDefinitionId} onChange={(event) => setForm((current) => ({ ...current, categoryDefinitionId: event.target.value }))}><option value="">Select category</option>{refs.categories.filter((category) => category.status || category.id === form.categoryDefinitionId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Input></FormGroup>
            <Row><Col md="6"><FormGroup><Label>Amount</Label><Input type="number" min="0" step="0.01" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></FormGroup></Col><Col md="6"><FormGroup><Label>Date</Label><Input type="date" required value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} /></FormGroup></Col></Row>
            <FormGroup><Label>Payment Method</Label><Input type="select" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}><option value="">Select method</option>{methods.map((method) => <option key={method}>{method}</option>)}</Input></FormGroup>
            <Row><Col md="6"><FormGroup><Label>Vendor</Label><Input type="select" value={form.vendorId} onChange={(event) => setForm((current) => ({ ...current, vendorId: event.target.value }))}><option value="">No vendor</option>{refs.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</Input></FormGroup></Col><Col md="6"><FormGroup><Label>Branch</Label><Input type="select" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}><option value="">All branches</option>{refs.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Input></FormGroup></Col></Row>
            <FormGroup><Label>Description</Label><Input type="textarea" rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormGroup>
            <FormGroup><Label>Note</Label><Input type="textarea" rows="2" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></FormGroup>
            <Button color="primary" type="submit" disabled={saving} className="mt-2">{saving && <Spinner size="sm" className="me-1" />}{editing ? "Save Expense" : "Add Expense"}</Button>
          </Form>
        </OffcanvasBody>
      </Offcanvas>
    </PageShell>
  );
};

export default Expenses;
