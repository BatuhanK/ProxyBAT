import type { DoctorCheckResult } from "@shared/types";
import { useCallback, useEffect, useState } from "react";

export function useDoctor() {
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorResult, setDoctorResult] = useState<DoctorCheckResult | null>(
    null,
  );
  const [installingMitmproxy, setInstallingMitmproxy] = useState(false);
  const [doctorInstallMsg, setDoctorInstallMsg] = useState("");

  const loadDoctorStatus = useCallback(async () => {
    setDoctorLoading(true);
    try {
      const doctorApi = window.api?.doctor;
      if (!doctorApi) {
        setDoctorResult(null);
        setDoctorInstallMsg("Doctor API unavailable");
        return;
      }
      const res = await doctorApi.check();
      setDoctorResult(res);
    } catch (err) {
      setDoctorResult(null);
      setDoctorInstallMsg(String(err));
    } finally {
      setDoctorLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorStatus();
  }, [loadDoctorStatus]);

  const installMitmproxy = async () => {
    setInstallingMitmproxy(true);
    setDoctorInstallMsg("");
    try {
      const doctorApi = window.api?.doctor;
      if (!doctorApi) {
        setDoctorInstallMsg("Doctor API unavailable");
        return;
      }
      const res = await doctorApi.installMitmproxy();
      if (res.success) {
        setDoctorInstallMsg("mitmproxy installed successfully");
        await loadDoctorStatus();
      } else {
        setDoctorInstallMsg(res.error || "Install failed");
      }
    } catch (err) {
      setDoctorInstallMsg(String(err));
    } finally {
      setInstallingMitmproxy(false);
      setTimeout(() => setDoctorInstallMsg(""), 6000);
    }
  };

  return {
    doctorLoading,
    doctorResult,
    installingMitmproxy,
    doctorInstallMsg,
    loadDoctorStatus,
    installMitmproxy,
  };
}
