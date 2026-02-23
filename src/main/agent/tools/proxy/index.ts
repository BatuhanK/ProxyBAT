import { buildSearchRequestsTool } from "./searchRequests";
import { buildGetResponseBodyTool } from "./getResponseBody";
import { buildGetRequestBodyTool } from "./getRequestBody";
import { buildGetLastRequestsForDomainTool } from "./getLastRequestsForDomain";
import { buildGetRequestDetailTool } from "./getRequestDetail";
import { buildGetSessionSummaryTool } from "./getSessionSummary";
import { buildListDomainsTool } from "./listDomains";
import { buildGetSlowRequestsTool } from "./getSlowRequests";
import { buildGetErrorRequestsTool } from "./getErrorRequests";
import { buildFindRequestsWithHeaderTool } from "./findRequestsWithHeader";
import { buildCompareRequestsTool } from "./compareRequests";
import { buildGetRequestsByStatusTool } from "./getRequestsByStatus";

export function buildProxyTools(linkedProxySessionId?: string) {
  return {
    search_requests: buildSearchRequestsTool(linkedProxySessionId),
    get_response_body: buildGetResponseBodyTool(),
    get_request_body: buildGetRequestBodyTool(),
    get_last_requests_for_domain: buildGetLastRequestsForDomainTool(linkedProxySessionId),
    get_request_detail: buildGetRequestDetailTool(),
    get_session_summary: buildGetSessionSummaryTool(linkedProxySessionId),
    list_domains: buildListDomainsTool(linkedProxySessionId),
    get_slow_requests: buildGetSlowRequestsTool(linkedProxySessionId),
    get_error_requests: buildGetErrorRequestsTool(linkedProxySessionId),
    find_requests_with_header: buildFindRequestsWithHeaderTool(linkedProxySessionId),
    compare_requests: buildCompareRequestsTool(),
    get_requests_by_status: buildGetRequestsByStatusTool(linkedProxySessionId),
  };
}
