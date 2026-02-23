import { httpReplay } from './httpReplay'
import { fuzzParameter } from './fuzzParameter'
import { checkRateLimit } from './checkRateLimit'
import { createTestSession } from './createTestSession'
import { buildRunPythonScriptTool } from './runPythonScript'

/**
 * Build all security researcher tools.
 * These tools allow testing for common vulnerabilities:
 * - HTTP replay with modifications
 * - Parameter fuzzing (IDOR, injection, enumeration)
 * - Rate limit detection
 * - Test session labeling
 */
export function buildSecurityResearcherTools() {
  return {
    http_replay: httpReplay,
    fuzz_parameter: fuzzParameter,
    check_rate_limit: checkRateLimit,
    create_test_session: createTestSession,
  }
}

/**
 * Build all PoC tester tools.
 * These tools allow executing custom Python scripts for targeted exploitation.
 * Requires a workspace path for security sandboxing.
 */
export function buildPocTesterTools(workspacePath: string) {
  return {
    run_python_script: buildRunPythonScriptTool(workspacePath),
  }
}
