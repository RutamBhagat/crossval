import { isIP } from "node:net";

import { env } from "@crossval/env/web";
import { type NextRequest, NextResponse } from "next/server";

const CLIENT_IP_HEADER = "x-crossval-client-ip";
const ORIGIN_TOKEN_HEADER = "x-crossval-origin-token";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const clientIp = request.headers.get("x-forwarded-for")?.trim();

  if (!clientIp || isIP(clientIp) === 0) {
    return Response.json(
      { error: "client_ip_unavailable" },
      { status: 500 },
    );
  }

  const headers = new Headers(request.headers);
  headers.set(CLIENT_IP_HEADER, clientIp);
  headers.set(ORIGIN_TOKEN_HEADER, env.API_ORIGIN_TOKEN);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
