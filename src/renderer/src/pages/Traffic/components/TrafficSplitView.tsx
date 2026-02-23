import { RequestDetail } from "@renderer/components/RequestDetail/RequestDetail";
import {
  RequestTable,
  type ColId,
} from "@renderer/components/RequestTable/RequestTable";
import { cn } from "@renderer/lib/utils";
import type { HttpRequest } from "@shared/types";

interface TrafficSplitViewProps {
  requests: HttpRequest[];
  selectedId: string | null;
  selectedRequest: HttpRequest | null;
  isLoading: boolean;
  visible: Record<ColId, boolean>;
  widths: Record<ColId, number>;
  onToggleVisible: (id: ColId) => void;
  onApplyDelta: (id: ColId, delta: number) => void;
  onSelect: (id: string | null) => void;
  onResend: (request: HttpRequest) => void;
}

export function TrafficSplitView({
  requests,
  selectedId,
  selectedRequest,
  isLoading,
  visible,
  widths,
  onToggleVisible,
  onApplyDelta,
  onSelect,
  onResend,
}: TrafficSplitViewProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className={cn(
          "overflow-hidden",
          selectedRequest ? "w-1/2 border-r border-border" : "flex-1",
        )}
      >
        <RequestTable
          requests={requests}
          selectedId={selectedId}
          onSelect={onSelect}
          isLoading={isLoading}
          visible={visible}
          onToggleVisible={onToggleVisible}
          widths={widths}
          onApplyDelta={onApplyDelta}
          onResend={onResend}
        />
      </div>

      {selectedRequest && (
        <div className="flex-1 overflow-hidden">
          <RequestDetail
            request={selectedRequest}
            onClose={() => onSelect(null)}
          />
        </div>
      )}
    </div>
  );
}
