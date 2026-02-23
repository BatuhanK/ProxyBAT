import { ScriptConsole } from "@renderer/components/ScriptConsole/ScriptConsole";
import { ResourceFilterBar, TrafficSplitView, TrafficToolbar } from "./components";
import { useTraffic } from "./hooks/useTraffic";

export function TrafficPage() {
  const traffic = useTraffic();

  return (
    <div className="flex flex-col h-full">
      <TrafficToolbar
        search={traffic.search}
        onSearchChange={traffic.setSearch}
        method={traffic.method}
        onMethodChange={traffic.setMethod}
        statusCat={traffic.statusCat}
        onStatusCatChange={traffic.setStatusCat}
        requestTotal={traffic.requestTotal}
        filteredCount={traffic.filteredRequests.length}
        resourceType={traffic.resourceType}
        activeViewSessionId={traffic.activeViewSessionId}
        isPinned={traffic.isPinned}
        onTogglePin={traffic.togglePin}
        onRefresh={() => traffic.activeViewSessionId && traffic.fetchRequests()}
        deleteMenuOpen={traffic.deleteMenuOpen}
        setDeleteMenuOpen={traffic.setDeleteMenuOpen}
        deleteMenuRef={traffic.deleteMenuRef}
        onClearSession={traffic.clearSession}
        onDeleteFiltered={traffic.handleDeleteFiltered}
      />

      <ResourceFilterBar
        resourceType={traffic.resourceType}
        onChange={traffic.setResourceType}
      />

      <TrafficSplitView
        requests={traffic.filteredRequests}
        selectedId={traffic.selectedRequestId}
        selectedRequest={traffic.selectedRequest}
        isLoading={traffic.isLoadingRequests}
        visible={traffic.visible}
        widths={traffic.widths}
        onToggleVisible={traffic.onToggleVisible}
        onApplyDelta={traffic.onApplyDelta}
        onSelect={traffic.setSelectedRequest}
        onResend={traffic.handleResend}
      />

      <ScriptConsole />
    </div>
  );
}
