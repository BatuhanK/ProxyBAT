import type { AgentRole } from "@renderer/store/agentStore";
import {
  Bot,
  Shield,
  FlaskConical,
  ShieldCheck,
  Code2,
} from "lucide-react";
import React from "react";

type RoleMeta = {
  label: string;
  shortLabel: string;
  badgeClass: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
  examples: string[];
};

export const ROLE_META: Record<AgentRole, RoleMeta> = {
  general: {
    label: "General",
    shortLabel: "General",
    badgeClass: "text-primary border-primary/30",
    icon: React.createElement(Bot, { className: "w-3.5 h-3.5 text-primary" }),
    placeholder: "Ask about traffic, analyze requests, compare responses...",
    description: "Ask me anything about your captured HTTP traffic.",
    examples: [
      "Show me all failed requests in the last session",
      "What domains are slowest to respond?",
      "Find requests with Authorization headers",
      "Summarize the current session traffic",
      "Compare the last two POST requests to /api/login",
    ],
  },
  security_researcher: {
    label: "Security Researcher",
    shortLabel: "Researcher",
    badgeClass: "text-yellow-400 border-yellow-400/30",
    icon: React.createElement(Shield, { className: "w-3.5 h-3.5 text-yellow-400" }),
    placeholder: "Analyze traffic for vulnerabilities, test endpoints...",
    description:
      "I analyze HTTP traffic for security vulnerabilities and write detailed reports.",
    examples: [
      "Analyze intercepted traffic for IDOR vulnerabilities",
      "Check all endpoints for missing rate limiting",
      "Look for JWT weaknesses in Authorization headers",
      "Test for SQL injection in POST body parameters",
      "Scan for sensitive data exposure in responses",
    ],
  },
  poc_creator: {
    label: "PoC Creator",
    shortLabel: "PoC Creator",
    badgeClass: "text-orange-400 border-orange-400/30",
    icon: React.createElement(FlaskConical, { className: "w-3.5 h-3.5 text-orange-400" }),
    placeholder: "Generate PoC scripts for findings in the security report...",
    description:
      "I read the security report and create Python PoC scripts for High/Critical findings.",
    examples: [
      "Generate PoCs for all critical findings",
      "Create an IDOR exploitation script",
      "Write a rate-limit bypass PoC",
      "Build a JWT manipulation test script",
      "Generate a path traversal PoC",
    ],
  },
  poc_tester: {
    label: "PoC Tester",
    shortLabel: "PoC Tester",
    badgeClass: "text-green-400 border-green-400/30",
    icon: React.createElement(ShieldCheck, { className: "w-3.5 h-3.5 text-green-400" }),
    placeholder: "Run PoC scripts and collect test results...",
    description:
      "I execute PoC scripts, capture results, and write a structured test report.",
    examples: [
      "Run all PoC scripts and collect results",
      "Execute the IDOR PoC and report findings",
      "Test all High severity PoCs",
      "Retry failed PoC scripts with fixes",
      "Summarize test results into a report",
    ],
  },
  script_developer: {
    label: "Script Developer",
    shortLabel: "Script Dev",
    badgeClass: "text-cyan-400 border-cyan-400/30",
    icon: React.createElement(Code2, { className: "w-3.5 h-3.5 text-cyan-400" }),
    placeholder: "Write, debug, and iterate on mitmproxy intercept scripts...",
    description:
      "I write Python mitmproxy addon scripts, install them live, read their logs, and fix bugs iteratively.",
    examples: [
      "Write a script that logs all JSON responses from api.example.com",
      "Inject a risk analysis bar into listing pages using the LLM",
      "Add an Authorization header to all requests to /api/v2/",
      "Block all requests to ads.example.com",
      "Rewrite the feature_flags field in /api/config responses",
    ],
  },
};
