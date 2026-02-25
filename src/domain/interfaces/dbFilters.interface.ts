import type { WhereFilterOp } from "firebase-admin/firestore";

export interface DbFilters {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}
