import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Server } from "lucide-react";

/**
 * Critical notification component for service incidents
 * Displays important service status updates to users
 */
export default function CriticalNotification(): React.ReactElement {
  return (
    <div className="w-full mb-4">
      <Alert className="border-red-500/50 bg-red-500/5 text-red-400">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="font-semibold">CRITICAL SERVICE NOTICE</span>
              <Badge variant="destructive" className="text-xs">
                ACTIVE INCIDENT
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              We are currently experiencing network connectivity issues due to
              our hosting provider's infrastructure problems. Multiple submarine
              cable outages in the APAC region are affecting our services,
              causing increased latency and intermittent connectivity.
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="font-medium mb-2">What we're doing:</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>
                  Working with upstream providers to optimize traffic routing
                </li>
                <li>
                  Implementing additional mitigations to reduce service impact
                </li>
                <li>
                  Migrating to multiple providers (Amazon, RedHat, Heroku) for
                  better redundancy
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-red-300/80">
                We apologize for the inconvenience and appreciate your patience
                during this migration.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={() =>
                  window.open(
                    "https://status.digitalocean.com/incidents/st0l04khlrgl",
                    "_blank",
                  )}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Provider Status
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
