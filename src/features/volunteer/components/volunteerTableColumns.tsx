import type { DataTableColumn } from "../../../components";
import type { VolunteerApplication, VolunteerApplicationStatus } from "../types";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatusClass(status: VolunteerApplicationStatus | null) {
  return status ? `order-status--${status}` : "order-status--unknown";
}

export function getVolunteerApplicationColumns(
  labels: { createdAt: string; email: string; name: string; phone: string; status: string; pending: string; approved: string; rejected: string; unknownStatus: string },
): Array<DataTableColumn<VolunteerApplication>> {
  return [
    { className: "order-table__cell--company", key: "name", label: labels.name, render: (application) => application.fullName || "—", supportingText: (application) => application.email || "—", variant: "primary" },
    { className: "order-table__cell--identifier", key: "phone", label: labels.phone, render: (application) => application.phone || "—" },
    { className: "order-table__cell--status", key: "status", label: labels.status, render: (application) => <span className={`order-status ${getStatusClass(application.status)}`}>{application.status ? labels[application.status] : labels.unknownStatus}</span>, variant: "badge" },
    { className: "order-table__cell--created", key: "created", label: labels.createdAt, render: (application) => formatDate(application.createdAt) },
  ];
}
