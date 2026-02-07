"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ExportDataButton() {
  const onExportData = () => {
    toast.info("Preparing your data export...", {
        description: "We will email you a download link shortly."
    })
  }

  return (
    <Button variant="outline" onClick={onExportData}>Export Data</Button>
  )
}
