import { AgentRole } from "@shared/ipc-contracts";
import { buildFileTools } from "./file";
import { buildProxyTools } from "./proxy";
import { buildScriptTools } from "./script";
import { buildPocTesterTools, buildSecurityResearcherTools } from "./security";

export function buildAllTools(
  workspacePath: string,
  role: AgentRole = "general",
  onFileWrite?: (path: string) => void,
) {
  const proxyTools = buildProxyTools();
  const fileTools = buildFileTools(workspacePath, onFileWrite);
  const scriptTools = buildScriptTools();

  if (role === "security_researcher") {
    return {
      ...proxyTools,
      ...fileTools,
      ...scriptTools,
      ...buildSecurityResearcherTools(),
    };
  }

  if (role === "poc_creator") {
    // PoCCreator reads the security report and writes PoC scripts — file tools scoped to workspace
    return {
      ...fileTools,
    };
  }

  if (role === "poc_tester") {
    // PoCTester runs scripts and writes results — file tools + script runner
    return {
      ...fileTools,
      ...buildPocTesterTools(workspacePath),
    };
  }

  // general: full proxy + file + script tools
  return {
    ...proxyTools,
    ...fileTools,
    ...scriptTools,
  };
}
