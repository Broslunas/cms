
"use client";

import { CheckCircle2, XCircle, Loader2, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Deployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED";
  inspectorUrl: string;
  commit?: {
    message: string;
    commitSha: string;
    commitAuthorName: string;
  };
}

interface DeploymentListProps {
  deployments: Deployment[];
  loading: boolean;
  onRefresh: () => void;
}

export function DeploymentList({ deployments, loading, onRefresh }: DeploymentListProps) {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Deployments</h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div className="space-y-3">
          {deployments.map((deploy) => (
            <Card key={deploy.uid} className="overflow-hidden">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {deploy.state === "READY" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {deploy.state === "ERROR" && <XCircle className="h-4 w-4 text-red-500" />}
                    {(deploy.state === "BUILDING" || deploy.state === "QUEUED") && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {deploy.state === "CANCELED" && <XCircle className="h-4 w-4 text-gray-500" />}

                    <span
                      className={`text-sm font-medium ${
                        deploy.state === "READY"
                          ? "text-green-600"
                          : deploy.state === "ERROR"
                          ? "text-red-600"
                          : "text-foreground"
                      }`}
                    >
                      {deploy.state}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(deploy.created).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-sm font-medium truncate">{deploy.commit?.message || "No commit message"}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {deploy.commit?.commitSha?.substring(0, 7)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {deploy.url && (
                    <a href={`https://${deploy.url}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs h-8">
                        <ExternalLink className="mr-2 h-3 w-3" /> Preview
                      </Button>
                    </a>
                  )}
                  <a href={deploy.inspectorUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs h-8">
                      Inspect
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
