import { useEffect, useMemo, useState } from "react";
import { useResendStore } from "@renderer/store/resendStore";
import type { ResendTab } from "@renderer/store/resendStore";

export function useResendRequest(tab: ResendTab) {
  const { updateTab, setSending, setResponse } = useResendStore();
  const [activeSection, setActiveSection] = useState<"headers" | "body">(
    "headers",
  );
  const [curlBinary, setCurlBinary] = useState("curl");

  useEffect(() => {
    window.api.settings
      .get()
      .then((r) => {
        if (r.settings?.curlBinary) setCurlBinary(r.settings.curlBinary);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    setSending(tab.id, true);
    try {
      const result = await window.api.request.resend({
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        body: tab.body || null,
        curlBinary,
      });
      setResponse(tab.id, result, result.error ?? null);
    } catch (err) {
      setResponse(tab.id, null, String(err));
    }
  };

  const onMethodChange = (value: string) => updateTab(tab.id, { method: value });
  const onUrlChange = (value: string) => updateTab(tab.id, { url: value });
  const onHeadersChange = (value: Record<string, string>) =>
    updateTab(tab.id, { headers: value });
  const onBodyChange = (value: string) => updateTab(tab.id, { body: value });

  const isSendDisabled = useMemo(
    () => tab.sending || !tab.url.trim(),
    [tab.sending, tab.url],
  );

  return {
    activeSection,
    setActiveSection,
    isSendDisabled,
    handleSend,
    onMethodChange,
    onUrlChange,
    onHeadersChange,
    onBodyChange,
  };
}
