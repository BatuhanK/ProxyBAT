import { useResendStore } from "@renderer/store/resendStore";
import { useMemo } from "react";

export function useResendTabs() {
  const { tabs, activeTabId, closeTab, setActiveTab } = useResendStore();
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId],
  );

  return {
    tabs,
    activeTabId,
    activeTab,
    closeTab,
    setActiveTab,
  };
}
