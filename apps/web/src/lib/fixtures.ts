import harborContract from "@/data/harbor-analytics/contract.json";
import harborExpected from "@/data/harbor-analytics/expected_exceptions.json";
import nexteraContract from "@/data/nextera-systems/contract.json";
import nexteraExpected from "@/data/nextera-systems/expected_exceptions.json";
import { ExceptionFlagSchema, type ExceptionFlag } from "@/lib/agent";
import { z } from "zod";

export type FixtureId = "nextera-systems" | "harbor-analytics";

const FixtureContractSchema = z.object({
  id: z.string(),
  vendor_name: z.string(),
  title: z.string(),
  effective_date: z.string(),
  end_date: z.string(),
  clauses: z.array(
    z.object({
      id: z.string(),
      section: z.string(),
      title: z.string(),
      text: z.string(),
    }),
  ),
});

export type FixtureContract = z.infer<typeof FixtureContractSchema>;

export type FixtureMeta = {
  id: FixtureId;
  name: string;
  vendorName: string;
  agreementTitle: string;
  description: string;
  invoiceCount: number;
  labeledExceptions: number;
  /** Full fixture invoice inventory for report faithfulness grounding. */
  invoiceIds: string[];
  contract: FixtureContract;
  expectedExceptions: ExceptionFlag[];
};

function parseFixture(
  id: FixtureId,
  meta: Omit<FixtureMeta, "id" | "contract" | "expectedExceptions">,
  contractJson: unknown,
  expectedJson: unknown,
): FixtureMeta {
  return {
    id,
    ...meta,
    contract: FixtureContractSchema.parse(contractJson),
    expectedExceptions: z.array(ExceptionFlagSchema).parse(expectedJson),
  };
}

export const FIXTURES: Record<FixtureId, FixtureMeta> = {
  "nextera-systems": parseFixture(
    "nextera-systems",
    {
      name: "Nextera Systems",
      vendorName: "Nextera Systems, Inc.",
      agreementTitle: "Master SaaS Platform Agreement",
      description: "5 invoices — 1 clean, 4 labeled exceptions ($10k monthly cap).",
      invoiceCount: 5,
      labeledExceptions: 4,
      invoiceIds: [
        "inv-2025-001",
        "inv-2025-002",
        "inv-2025-003",
        "inv-2025-004",
        "inv-2025-005-duplicate",
      ],
    },
    nexteraContract,
    nexteraExpected,
  ),
  "harbor-analytics": parseFixture(
    "harbor-analytics",
    {
      name: "Harbor Analytics",
      vendorName: "Harbor Analytics, LLC",
      agreementTitle: "Managed Analytics Services Agreement",
      description: "5 invoices — 1 clean, 4 labeled exceptions ($15k monthly cap).",
      invoiceCount: 5,
      labeledExceptions: 4,
      invoiceIds: [
        "inv-ha-001",
        "inv-ha-002",
        "inv-ha-003",
        "inv-ha-004",
        "inv-ha-005-duplicate",
      ],
    },
    harborContract,
    harborExpected,
  ),
};

export const FIXTURE_LIST = Object.values(FIXTURES);

export function getFixture(id: FixtureId): FixtureMeta {
  return FIXTURES[id];
}

export function clauseTitle(contract: FixtureContract, section: string): string | undefined {
  return contract.clauses.find((clause) => clause.section === section)?.title;
}
