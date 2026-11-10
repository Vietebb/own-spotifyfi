import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const configuredPasscode = process.env.ADMIN_PASSCODE;
    if (!configuredPasscode) {
      return NextResponse.json(
        { error: "ADMIN_PASSCODE is not configured in server environment." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const candidatePasscode =
      body?.passcode || request.headers.get("x-admin-passcode");

    if (candidatePasscode && candidatePasscode === configuredPasscode) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json(
      { error: "Invalid passcode. Access denied." },
      { status: 401 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal verification error." },
      { status: 500 }
    );
  }
}
