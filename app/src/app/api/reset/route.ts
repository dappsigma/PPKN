import { NextRequest, NextResponse } from "next/server";
import { resetAccountSanction, getAccountStatus } from "@/lib/sanctions";

export async function GET(req: NextRequest) {
  const accountId = req.cookies.get("accountId")?.value;
  if (!accountId) {
    return NextResponse.json({ error: "Missing account ID" }, { status: 401 });
  }

  const status = getAccountStatus(accountId, process.env.FAST_TEST_MODE === "true");
  return NextResponse.json({ status });
}

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get("accountId")?.value;
  if (!accountId) {
    return NextResponse.json({ error: "Missing account ID" }, { status: 401 });
  }

  resetAccountSanction(accountId);
  
  return NextResponse.json({
    success: true,
    status: getAccountStatus(accountId, process.env.FAST_TEST_MODE === "true"),
  });
}
