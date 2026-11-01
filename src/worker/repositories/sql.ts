import { SPOT_HOLDING_STATUSES } from '../../shared/status';

/** `'accepted', 'submitted', 'done'`: a constant, safe to place directly in SQL text. */
export const SPOT_HOLDING_SQL = SPOT_HOLDING_STATUSES.map((status) => `'${status}'`).join(', ');
