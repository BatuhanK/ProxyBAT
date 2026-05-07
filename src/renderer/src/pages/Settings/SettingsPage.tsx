import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui/tabs";
import { Bot, Globe, MessageSquare, Shield, Stethoscope } from "lucide-react";
import { useSettings } from "./hooks/useSettings";
import { useDoctor } from "./hooks/useDoctor";
import {
  ProxyTab,
  CertificateTab,
  DoctorTab,
  AgentTab,
  AiProvidersTab,
} from "./tabs";

export function SettingsPage() {
  const settings = useSettings();
  const doctor = useDoctor();

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-0 flex-shrink-0">
        <h1 className="text-lg font-semibold mb-4">Settings</h1>
      </div>

      <Tabs defaultValue="proxy" className="flex-1 flex flex-col min-h-0 px-6">
        <TabsList className="flex-shrink-0 w-fit mb-4">
          <TabsTrigger value="proxy">
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            Proxy
          </TabsTrigger>
          <TabsTrigger value="certificate">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Certificate
          </TabsTrigger>
          <TabsTrigger value="doctor">
            <Stethoscope className="w-3.5 h-3.5 mr-1.5" />
            Doctor
          </TabsTrigger>
          <TabsTrigger value="agent">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Agent
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            AI Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proxy" className="flex-1 overflow-auto pb-6">
          <ProxyTab
            settings={settings.settings}
            portInput={settings.portInput}
            setPortInput={settings.setPortInput}
            setSettings={settings.setSettings}
            saving={settings.saving}
            saveMsg={settings.saveMsg}
            saveSettings={settings.saveSettings}
            rules={settings.rules}
            newPattern={settings.newPattern}
            setNewPattern={settings.setNewPattern}
            addRule={settings.addRule}
            toggleRule={settings.toggleRule}
            deleteRule={settings.deleteRule}
            ignoreRules={settings.ignoreRules}
            newIgnorePattern={settings.newIgnorePattern}
            setNewIgnorePattern={settings.setNewIgnorePattern}
            addIgnoreRule={settings.addIgnoreRule}
            toggleIgnoreRule={settings.toggleIgnoreRule}
            deleteIgnoreRule={settings.deleteIgnoreRule}
            proxyServices={settings.proxyServices}
            proxyStatusLoading={settings.proxyStatusLoading}
            proxySetting={settings.proxySetting}
            proxyUnsetting={settings.proxyUnsetting}
            proxyMsg={settings.proxyMsg}
            setSystemProxy={settings.setSystemProxy}
            unsetSystemProxy={settings.unsetSystemProxy}
            loadSystemProxyStatus={settings.loadSystemProxyStatus}
          />
        </TabsContent>

        <TabsContent value="certificate" className="flex-1 overflow-auto pb-6">
          <CertificateTab
            certInfo={settings.certInfo}
            certPemPath={settings.certPemPath}
            exportCert={settings.exportCert}
            regenerateCert={settings.regenerateCert}
          />
        </TabsContent>

        <TabsContent value="doctor" className="flex-1 overflow-auto pb-6">
          <DoctorTab
            doctorLoading={doctor.doctorLoading}
            doctorResult={doctor.doctorResult}
            doctorInstallMsg={doctor.doctorInstallMsg}
            installingMitmproxy={doctor.installingMitmproxy}
            loadDoctorStatus={doctor.loadDoctorStatus}
            installMitmproxy={doctor.installMitmproxy}
          />
        </TabsContent>

        <TabsContent value="agent" className="flex-1 overflow-auto pb-6">
          <AgentTab
            workspaceDirInput={settings.workspaceDirInput}
            setWorkspaceDirInput={settings.setWorkspaceDirInput}
            browseWorkspaceDir={settings.browseWorkspaceDir}
            saveWorkspaceDir={settings.saveWorkspaceDir}
            workspaceSaving={settings.workspaceSaving}
            workspaceSaveMsg={settings.workspaceSaveMsg}
            curlBinaryInput={settings.curlBinaryInput}
            setCurlBinaryInput={settings.setCurlBinaryInput}
            saveCurlBinary={settings.saveCurlBinary}
            curlSaving={settings.curlSaving}
            curlSaveMsg={settings.curlSaveMsg}
            activeCurlBinary={settings.settings.curlBinary}
          />
        </TabsContent>

        <TabsContent value="ai" className="flex-1 overflow-auto pb-6">
          <AiProvidersTab
            aiSettings={settings.aiSettings}
            setAiSettings={settings.setAiSettings}
            aiSaving={settings.aiSaving}
            aiSaveMsg={settings.aiSaveMsg}
            showKimiKey={settings.showKimiKey}
            setShowKimiKey={settings.setShowKimiKey}
            showCopilotKey={settings.showCopilotKey}
            setShowCopilotKey={settings.setShowCopilotKey}
            showZaiKey={settings.showZaiKey}
            setShowZaiKey={settings.setShowZaiKey}
            showDeepseekKey={settings.showDeepseekKey}
            setShowDeepseekKey={settings.setShowDeepseekKey}
            opencodeInPath={settings.opencodeInPath}
            crawlLoading={settings.crawlLoading}
            crawlFound={settings.crawlFound}
            crawlError={settings.crawlError}
            crawlSelected={settings.crawlSelected}
            setCrawlSelected={settings.setCrawlSelected}
            setCrawlFound={settings.setCrawlFound}
            saveAiSettings={settings.saveAiSettings}
            crawlOpencode={settings.crawlOpencode}
            applyCrawledKeys={settings.applyCrawledKeys}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
