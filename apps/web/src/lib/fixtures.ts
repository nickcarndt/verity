import harborContract from "@/data/harbor-analytics/contract.json";
import harborExpected from "@/data/harbor-analytics/expected_exceptions.json";
import nexteraContract from "@/data/nextera-systems/contract.json";
import nexteraExpected from "@/data/nextera-systems/expected_exceptions.json";
import type { ExceptionFlag } from "@/lib/agent";

export type FixtureId = "nextera-systems" | "harbor-analytics";

export type FixtureContract = {
  id: string;
  vendor_name: string;
  title: string;
  effective_date: string;
  end_date: string;
  clauses: Array<{
    id: string;
    section: string;
    title: string;
    text: string;
  }>;
};

export type FixtureMeta = {
  id: FixtureId;
  name: string;
  vendorName: string;
  agreementTitle: string;
  description: string;
  invoiceCount: number;
  labeledExceptions: number;
  contract: FixtureContract;
  expectedExceptions: ExceptionFlag[];
};

export const FIXTURES: Record<FixtureId, FixtureMeta> = {
  "nextera-systems": {
    id: "nextera-systems",
    name: "Nextera Systems",
    vendorName: "Nextera Systems, Inc.",
    agreementTitle: "Master SaaS Platform Agreement",
    description: "5 invoices — 1 clean, 4 labeled exceptions ($10k monthly cap).",
    invoiceCount: 5,
    labeledExceptions: 4,
    contract: nexteraContract as FixtureContract,
    expectedExceptions: nexteraExpected as ExceptionFlag[],
  },
  "harbor-analytics": {
    id: "harbor-analytics",
    name: "Harbor Analytics",
    vendorName: "Harbor Analytics, LLC",
    agreementTitle: "Managed Analytics Services Agreement",
    description: "5 invoices — 1 clean, 4 labeled exceptions ($15k monthly cap).",
    invoiceCount: 5,
    labeledExceptions: 4,
    contract: harborContract as FixtureContract,
    expectedExceptions: harborExpected as ExceptionFlag[],
  },
};

export const FIXTURE_LIST = Object.values(FIXTURES);

export function getFixture(id: FixtureId): FixtureMeta {
  return FIXTURES[id];
}

export function clauseTitle(contract: FixtureContract, section: string): string | undefined {
  return contract.clauses.find((clause) => clause.section === section)?.title;
}
