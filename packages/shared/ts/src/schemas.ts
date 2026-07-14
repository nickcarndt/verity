import { z } from "zod";

/** Typed reconciliation exceptions the agent flags. */
export const ExceptionType = z.enum([
  "overbilling",
  "missing_po",
  "out_of_term",
  "duplicate_invoice",
]);
export type ExceptionType = z.infer<typeof ExceptionType>;

/** Financial impact tier for an exception. */
export const Severity = z.enum(["critical", "high", "medium", "low"]);
export type Severity = z.infer<typeof Severity>;

/** Contract obligation categories extracted from clauses. */
export const ObligationType = z.enum([
  "fee_cap",
  "po_required",
  "term_window",
  "no_duplicates",
]);
export type ObligationType = z.infer<typeof ObligationType>;

/** Outcome of reconciling a single invoice. */
export const ReconciliationStatus = z.enum(["matched", "flagged"]);
export type ReconciliationStatus = z.infer<typeof ReconciliationStatus>;

/** Pointer to a specific contract clause — used for citations. */
export const ClauseRef = z.object({
  section: z.string(),
  text: z.string(),
});
export type ClauseRef = z.infer<typeof ClauseRef>;

/** A numbered section of a vendor contract. */
export const Clause = z.object({
  id: z.string(),
  section: z.string(),
  title: z.string(),
  text: z.string(),
});
export type Clause = z.infer<typeof Clause>;

/** Vendor master agreement ingested for reconciliation. */
export const Contract = z.object({
  id: z.string(),
  vendor_name: z.string(),
  title: z.string(),
  effective_date: z.string().date(),
  end_date: z.string().date(),
  clauses: z.array(Clause),
});
export type Contract = z.infer<typeof Contract>;

/** Structured payment rule extracted from a contract clause. */
export const Obligation = z.object({
  id: z.string(),
  type: ObligationType,
  description: z.string(),
  clause_ref: ClauseRef,
  max_amount: z.string().nullable().optional(),
  requires_po: z.boolean().optional(),
  valid_from: z.string().date().nullable().optional(),
  valid_to: z.string().date().nullable().optional(),
});
export type Obligation = z.infer<typeof Obligation>;

/** Single billed line on an invoice. */
export const LineItem = z.object({
  description: z.string(),
  quantity: z.string(),
  unit_price: z.string(),
  amount: z.string(),
});
export type LineItem = z.infer<typeof LineItem>;

/** Structured vendor invoice for reconciliation. */
export const Invoice = z.object({
  id: z.string(),
  invoice_number: z.string(),
  vendor_name: z.string(),
  invoice_date: z.string().date(),
  po_number: z.string().nullable().optional(),
  line_items: z.array(LineItem).min(1),
  total_amount: z.string(),
});
export type Invoice = z.infer<typeof Invoice>;

/** A single flagged mismatch with clause grounding and dollar impact. */
export const ExceptionFlag = z.object({
  id: z.string(),
  type: ExceptionType,
  severity: Severity,
  description: z.string(),
  dollar_impact: z.string(),
  clause_ref: ClauseRef,
  invoice_id: z.string(),
  evidence: z.string(),
});
export type ExceptionFlag = z.infer<typeof ExceptionFlag>;

/** Outcome of reconciling one invoice against contract obligations. */
export const ReconciliationResult = z.object({
  invoice_id: z.string(),
  status: ReconciliationStatus,
  exceptions: z.array(ExceptionFlag).default([]),
});
export type ReconciliationResult = z.infer<typeof ReconciliationResult>;
