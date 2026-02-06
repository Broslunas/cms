"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function StorageForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [settings, setSettings] = useState({
    s3Endpoint: "",
    s3Region: "",
    s3AccessKey: "",
    s3SecretKey: "",
    s3Bucket: "",
    s3PublicUrl: "",
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings({
            s3Endpoint: data.s3Endpoint || "",
            s3Region: data.s3Region || "",
            s3AccessKey: data.s3AccessKey || "",
            s3SecretKey: data.s3SecretKey || "",
            s3Bucket: data.s3Bucket || "",
            s3PublicUrl: data.s3PublicUrl || "",
          })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load storage settings")
      } finally {
        setIsFetching(false)
      }
    }
    fetchSettings()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      s3Endpoint: formData.get("s3Endpoint") as string,
      s3Region: formData.get("s3Region") as string,
      s3AccessKey: formData.get("s3AccessKey") as string,
      s3SecretKey: formData.get("s3SecretKey") as string,
      s3Bucket: formData.get("s3Bucket") as string,
      s3PublicUrl: formData.get("s3PublicUrl") as string,
    }

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Storage settings updated successfully")
      } else {
        toast.error("Failed to update storage settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error("An error occurred while saving")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s3Endpoint">S3 Endpoint</Label>
          <Input 
              id="s3Endpoint" 
              name="s3Endpoint" 
              defaultValue={settings.s3Endpoint} 
              placeholder="https://<accountid>.r2.cloudflarestorage.com" 
          />
          <p className="text-[0.8rem] text-muted-foreground">
            The API endpoint for your S3-compatible service.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s3Region">Region</Label>
          <Input 
              id="s3Region" 
              name="s3Region" 
              defaultValue={settings.s3Region} 
              placeholder="auto or us-east-1" 
          />
          <p className="text-[0.8rem] text-muted-foreground">
            The region where your bucket is located.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s3AccessKey">Access Key ID</Label>
          <Input 
              id="s3AccessKey" 
              name="s3AccessKey" 
              type="password"
              defaultValue={settings.s3AccessKey} 
              placeholder="Your access key" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s3SecretKey">Secret Access Key</Label>
          <Input 
              id="s3SecretKey" 
              name="s3SecretKey" 
              type="password"
              defaultValue={settings.s3SecretKey} 
              placeholder="Your secret key" 
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s3Bucket">Bucket Name</Label>
          <Input 
              id="s3Bucket" 
              name="s3Bucket" 
              defaultValue={settings.s3Bucket} 
              placeholder="my-assets-bucket" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s3PublicUrl">Public URL Prefix (Optional)</Label>
          <Input 
              id="s3PublicUrl" 
              name="s3PublicUrl" 
              defaultValue={settings.s3PublicUrl} 
              placeholder="https://cdn.example.com" 
          />
          <p className="text-[0.8rem] text-muted-foreground">
            Used to generate public URLs for uploaded files.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save storage settings"
        )}
      </Button>
    </form>
  )
}
