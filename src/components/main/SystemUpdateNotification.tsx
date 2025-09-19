import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Wifi } from "lucide-react";
import React from "react";

/**
 * System update notification component for global network maintenance
 */
function SystemUpdateNotification(): React.ReactElement {
  return (
    <Alert className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-amber-500/10 mb-6">
      <AlertTriangle className="h-5 w-5 text-orange-400" />
      <AlertDescription className="text-orange-100">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Wifi className="h-4 w-4 text-orange-400" />
              <span className="font-semibold text-orange-300">
                Global Network Update in Progress
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              We are currently performing a global update to our caching and DNS
              servers in the STELS network. You may experience traffic delays
              during this maintenance. Please wait for further notifications
              from our development team.
            </p>
            <div className="flex items-center space-x-1 mt-2 text-xs text-orange-200">
              <Clock className="h-3 w-3" />
              <span>Estimated completion: 20 September</span>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default SystemUpdateNotification;
