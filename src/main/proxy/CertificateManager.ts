/**
 * CertificateManager — wraps mitmproxy's auto-generated CA certificate.
 *
 * mitmproxy generates its own CA at ~/.mitmproxy/mitmproxy-ca-cert.pem on
 * first launch.  We just surface that cert to the UI so the user knows where
 * to find it and can export it to their OS trust store.
 *
 * No node-forge needed; mitmproxy handles all per-domain certificate generation.
 */

import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'
import type { CertificateInfo } from '@shared/types'

const MITMPROXY_CA_CERT = join(homedir(), '.mitmproxy', 'mitmproxy-ca-cert.pem')

export class CertificateManager {
  private static instance: CertificateManager

  static getInstance(): CertificateManager {
    if (!CertificateManager.instance) {
      CertificateManager.instance = new CertificateManager()
    }
    return CertificateManager.instance
  }

  /** No-op — mitmproxy initialises its own CA on first run. */
  async initialize(): Promise<void> {}

  getCACertPath(): string {
    return MITMPROXY_CA_CERT
  }

  getCertInfo(): CertificateInfo | null {
    if (!existsSync(MITMPROXY_CA_CERT)) return null
    try {
      // Use openssl to extract basic info without pulling in heavy deps
      const out = execSync(
        `openssl x509 -in "${MITMPROXY_CA_CERT}" -noout -subject -issuer -dates -fingerprint -sha256`,
        { encoding: 'utf8', timeout: 5000 }
      )
      const lines = out.split('\n')
      const get = (prefix: string) =>
        lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? ''

      return {
        subject: get('subject=').replace(/^CN\s*=\s*/, ''),
        issuer: get('issuer=').replace(/^CN\s*=\s*/, ''),
        validFrom: get('notBefore='),
        validTo: get('notAfter='),
        fingerprint: get('SHA256 Fingerprint='),
      }
    } catch {
      return {
        subject: 'mitmproxy',
        issuer: 'mitmproxy',
        validFrom: '',
        validTo: '',
        fingerprint: '',
      }
    }
  }

  /** Copy the mitmproxy CA cert PEM to targetPath. */
  async regenerate(): Promise<void> {
    // Trigger mitmproxy to re-generate by deleting its CA files
    // In practice users rarely need this; just surface the info.
    throw new Error(
      'To regenerate the mitmproxy CA, delete ~/.mitmproxy and restart the proxy.'
    )
  }
}
