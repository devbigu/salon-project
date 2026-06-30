/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Form,
  FormGroup,
  Input,
  Label,
  Offcanvas,
  OffcanvasBody,
  OffcanvasHeader,
  Spinner,
} from "reactstrap";
import { Button, Icon } from "@/components/Component";
import DataGrid from "@/components/salon/DataGrid";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { compactId } from "@/utils/salonFormat";

const emptyForm = { name: "", salonId: "" };

const downloadCsv = (rows) => {
  const content = [
    ["ID", "Name", "Status", "Expenses"],
    ...rows.map((row) => [
      row.id,
      row.name,
      row.status ? "Active" : "Inactive",
      row._count?.expenses || 0,
    ]),
  ]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "expense-categories.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

const ExpenseCategories = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [salons, setSalons] = useState([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categories, salonResult] = await Promise.all([
        salonApi.expenseCategories.list(),
        user?.role === "SUPER_ADMIN"
          ? salonApi.salons.list()
          : Promise.resolve({ data: [] }),
      ]);
      setRows(categories.data || []);
      setSalons(salonResult.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.role]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? rows.filter((row) => row.name.toLowerCase().includes(term) || row.id.toLowerCase().includes(term))
      : rows;
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, salonId: row.salonId || "" });
    setDrawerOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await salonApi.expenseCategories.update(editing.id, { name: form.name });
      } else {
        await salonApi.expenseCategories.create({
          name: form.name,
          ...(form.salonId ? { salonId: form.salonId } : {}),
        });
      }
      setDrawerOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try {
      await salonApi.expenseCategories.remove(row.id);
      await load();
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  return (
    <PageShell
      title="Expense Categories"
      description="Create and manage the categories used for salon expenses."
      tools={(
        <>
          <Button color="light" outline onClick={() => downloadCsv(visibleRows)}>
            <Icon name="download-cloud" /> Export
          </Button>
          <Button color="primary" className="btn-icon" onClick={openCreate} title="Add category">
            <Icon name="plus" />
          </Button>
        </>
      )}
    >
      {error && <Alert color="danger">{error}</Alert>}
      <div className="card card-bordered mb-4">
        <div className="card-inner d-flex flex-wrap align-items-center gap-3">
          <div className="form-control-wrap flex-grow-1" style={{ maxWidth: 360 }}>
            <div className="form-icon form-icon-left"><Icon name="search" /></div>
            <Input
              className="form-control-outlined"
              value={search}
              placeholder="Search category name or ID"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button color="warning" onClick={() => setSearch("")}>Reset Search</Button>
          <Button color="primary" outline onClick={() => downloadCsv(visibleRows)}>
            <Icon name="file-xls" /> Download CSV
          </Button>
          <div className="ms-auto text-soft">{visibleRows.length} categories</div>
        </div>
      </div>

      <DataGrid
        loading={loading}
        rows={visibleRows}
        columns={[
          { key: "id", label: "ID", render: compactId },
          { key: "name", label: "Name" },
          { key: "_count", label: "Expenses", render: (value) => value?.expenses || 0 },
          { key: "status", label: "Status", render: (value) => <StatusBadge value={value} /> },
        ]}
        onEdit={openEdit}
        onDelete={remove}
        renderActions={(row) => (
          <Button
            size="sm"
            color={row.status ? "warning" : "success"}
            outline
            onClick={async () => {
              try {
                await salonApi.expenseCategories.setStatus(row.id, !row.status);
                await load();
              } catch (statusError) {
                setError(statusError.message);
              }
            }}
          >
            {row.status ? "Deactivate" : "Activate"}
          </Button>
        )}
      />

      <Offcanvas
        isOpen={drawerOpen}
        toggle={() => setDrawerOpen((open) => !open)}
        direction="end"
        style={{ width: 420 }}
      >
        <OffcanvasHeader toggle={() => setDrawerOpen(false)}>
          {editing ? "Edit Expense Category" : "Add Expense Category"}
        </OffcanvasHeader>
        <OffcanvasBody>
          <Form onSubmit={save}>
            <FormGroup>
              <Label for="expense-category-name">Category Name</Label>
              <Input
                id="expense-category-name"
                required
                placeholder="Name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </FormGroup>
            {user?.role === "SUPER_ADMIN" && !editing && (
              <FormGroup>
                <Label for="expense-category-salon">Salon</Label>
                <Input
                  id="expense-category-salon"
                  type="select"
                  required
                  value={form.salonId}
                  onChange={(event) => setForm((current) => ({ ...current, salonId: event.target.value }))}
                >
                  <option value="">Select salon</option>
                  {salons.map((salon) => <option key={salon.id} value={salon.id}>{salon.name}</option>)}
                </Input>
              </FormGroup>
            )}
            <Button color="primary" type="submit" disabled={saving} className="mt-2">
              {saving && <Spinner size="sm" className="me-1" />}
              {editing ? "Save Category" : "Add Category"}
            </Button>
          </Form>
        </OffcanvasBody>
      </Offcanvas>
    </PageShell>
  );
};

export default ExpenseCategories;
