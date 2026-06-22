/* eslint-disable react/prop-types, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Alert } from "reactstrap";
import { Button, Icon } from "@/components/Component";
import DataGrid from "./DataGrid";
import DetailsModal from "./DetailsModal";
import SchemaModal from "./SchemaModal";

const ResourcePanel = ({
  title,
  description,
  api,
  columns,
  fields,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  createLabel,
  transformCreate,
  transformUpdate,
  renderActions,
  refreshKey,
  filterRows,
  onChanged,
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.list();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = async (row) => {
    setError("");
    try {
      const response = api.get ? await api.get(row.id) : { data: row };
      setEditing(response.data || row);
      setFormOpen(true);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "Unable to load record.");
    }
  };

  const openDetails = async (row) => {
    setError("");
    try {
      const response = api.get ? await api.get(row.id) : { data: row };
      setDetails(response.data || row);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "Unable to load record.");
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name || row.id}?`)) return;
    setError("");
    try {
      await api.remove(row.id);
      await load();
      await onChanged?.();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete.");
    }
  };

  const save = async (values) => {
    if (editing) {
      await api.update(
        editing.id,
        transformUpdate ? transformUpdate(values, editing) : values
      );
    } else {
      await api.create(transformCreate ? transformCreate(values) : values);
    }
    await load();
    await onChanged?.();
  };

  const visibleRows = filterRows ? filterRows(rows) : rows;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h5 className="title mb-1">{title}</h5>
          {description && <p className="text-soft mb-0">{description}</p>}
        </div>
        {canCreate && (
          <Button color="primary" onClick={openCreate}>
            <Icon name="plus" />
            <span>{createLabel || `Add ${title.replace(/s$/, "")}`}</span>
          </Button>
        )}
      </div>
      {error && <Alert color="danger">{error}</Alert>}
      <DataGrid
        rows={visibleRows}
        columns={columns}
        loading={loading}
        onView={openDetails}
        onEdit={canEdit && api.update ? openEdit : undefined}
        onDelete={canDelete && api.remove ? remove : undefined}
        renderActions={(row) => renderActions?.(row, load, setError)}
      />
      <SchemaModal
        isOpen={formOpen}
        toggle={() => setFormOpen((open) => !open)}
        title={`${editing ? "Edit" : "Add"} ${title.replace(/s$/, "")}`}
        fields={typeof fields === "function" ? fields(rows, editing) : fields}
        initialValues={editing}
        onSubmit={save}
      />
      <DetailsModal
        isOpen={Boolean(details)}
        toggle={() => setDetails(null)}
        title={`${title.replace(/s$/, "")} details`}
        data={details}
      />
    </div>
  );
};

export default ResourcePanel;
