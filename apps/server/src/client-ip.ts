import { getIPFromHeader } from "@better-auth/core/utils/ip";

const IPV6_SUBNET = 64;
const UNKNOWN_IP_KEY = "unknown";

function getClientRateLimitKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  const ip = forwardedFor
    ? getIPFromHeader(forwardedFor, { ipv6Subnet: IPV6_SUBNET })
    : null;

  if (!ip) {
    return UNKNOWN_IP_KEY;
  }

  return ip.includes(":") ? `v6:${ip}/${IPV6_SUBNET}` : `v4:${ip}`;
}

export { getClientRateLimitKey };
