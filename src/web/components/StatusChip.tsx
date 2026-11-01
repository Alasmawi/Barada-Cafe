import { STATUS_LABELS, type RequestStatus } from '../../shared/status';

export function StatusChip({ status }: { status: RequestStatus }) {
  return <span className={`status-chip status-chip--${status}`}>{STATUS_LABELS[status]}</span>;
}
