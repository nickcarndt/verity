import contract from "@/data/nextera-systems/contract.json";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(contract);
}
