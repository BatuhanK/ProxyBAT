import type { InterceptScript } from "@shared/types";

export const PHASE_OPTIONS: Array<{
  value: InterceptScript["phase"];
  label: string;
}> = [
  { value: "request", label: "Request" },
  { value: "response", label: "Response" },
  { value: "both", label: "Both" },
];

export const DEFAULT_CODE = `# Available context: 'flow' (mitmproxy HTTPFlow object)
# Runs inside mitmproxy hooks — full mitmproxy API available.
#
# Examples:
#   flow.request.headers["X-Debug"] = "1"
#   flow.response.headers["Cache-Control"] = "no-store"
#   print(flow.request.url)
`;
