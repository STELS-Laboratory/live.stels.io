/**
 * Export Certificate Hook
 * Reusable hook for exporting token certificates
 */

import { useCallback } from "react";
import { exportCertificate } from "../signing";
import { generateCertificateFilename } from "../utils";
import type { TokenGenesisCertificate } from "../types";

/**
 * Hook for exporting certificates to JSON files
 * Provides consistent export functionality with proper cleanup
 * @returns Export function
 */
export function useExportCertificate(): {
  exportCert: (certificate: TokenGenesisCertificate) => boolean;
} {
  const exportCert = useCallback((certificate: TokenGenesisCertificate): boolean => {
    try {
      const json = exportCertificate(certificate, "json");
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = generateCertificateFilename(
        certificate.token.metadata.symbol,
        "certificate"
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      return true;
    } catch {

      return false;
    }
  }, []);

  return { exportCert };
}
