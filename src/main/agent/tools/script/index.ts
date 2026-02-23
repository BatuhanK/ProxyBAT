import { buildScriptListTool } from "./scriptList";
import { buildScriptGetTool } from "./scriptGet";
import { buildScriptCreateTool } from "./scriptCreate";
import { buildScriptUpdateTool } from "./scriptUpdate";
import { buildScriptToggleTool } from "./scriptToggle";
import { buildScriptDeleteTool } from "./scriptDelete";
import { buildScriptGetLogsTool } from "./scriptGetLogs";

/**
 * Build all script management tools for mitmproxy intercept scripts.
 */
export function buildScriptTools() {
  return {
    script_list: buildScriptListTool(),
    script_get: buildScriptGetTool(),
    script_create: buildScriptCreateTool(),
    script_update: buildScriptUpdateTool(),
    script_toggle: buildScriptToggleTool(),
    script_delete: buildScriptDeleteTool(),
    script_get_logs: buildScriptGetLogsTool(),
  };
}
