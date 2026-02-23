import { Button } from "@renderer/components/ui/button";
import type { CertificateInfo } from "@shared/types";
import { Download, RefreshCw, Shield } from "lucide-react";
import { Section } from "../components";

interface CertificateTabProps {
  certInfo: CertificateInfo | null;
  certPemPath: string | null;
  exportCert: () => void;
  regenerateCert: () => void;
}

export function CertificateTab({
  certInfo,
  certPemPath,
  exportCert,
  regenerateCert,
}: CertificateTabProps) {
  return (
    <div className="flex-1 overflow-auto pb-6">
      <Section
        title="CA Certificate"
        icon={<Shield className="w-4 h-4 text-yellow-500" />}
      >
        <p className="text-xs text-muted-foreground mb-3">
          Install this root certificate in your OS/browser trust store to
          allow SSL interception without warnings.
        </p>
        {certInfo ? (
          <div className="rounded border border-border p-3 font-mono text-xs space-y-1 mb-3 bg-muted/20">
            <div>
              <span className="text-muted-foreground">Subject:</span>{" "}
              {certInfo.subject}
            </div>
            <div>
              <span className="text-muted-foreground">Issuer:</span>{" "}
              {certInfo.issuer}
            </div>
            <div>
              <span className="text-muted-foreground">Valid from:</span>{" "}
              {certInfo.validFrom}
            </div>
            <div>
              <span className="text-muted-foreground">Valid to:</span>{" "}
              {certInfo.validTo}
            </div>
            <div>
              <span className="text-muted-foreground">Fingerprint:</span>{" "}
              <span className="text-yellow-400">
                {certInfo.fingerprint}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mb-3">
            No certificate generated yet.
          </p>
        )}
        {certPemPath && (
          <p className="text-xs text-muted-foreground mb-3">
            PEM path:{" "}
            <code className="bg-muted px-1 rounded">{certPemPath}</code>
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={exportCert}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PEM
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-orange-400 border-orange-400/30 hover:text-orange-300"
            onClick={regenerateCert}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Regenerate
          </Button>
        </div>
      </Section>
    </div>
  );
}
