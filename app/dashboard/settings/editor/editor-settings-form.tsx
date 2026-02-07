"use client"

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"

export function EditorSettingsForm() {
  const [loading, setLoading] = useState(false)
  const [autosave, setAutosave] = useState(true)
  const [spellcheck, setSpellcheck] = useState(true)
  
  // Mock save function
  const onSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("Editor settings saved")
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Editor</h3>
        <p className="text-sm text-muted-foreground">
          Customize your writing experience and editor preferences.
        </p>
      </div>
      <Separator />
      
      <div className="space-y-8">
        <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Default Editor Mode</Label>
                    <p className="text-sm text-muted-foreground">
                        Choose between Visual (WYSIWYG) or Markdown mode as default.
                    </p>
                </div>
                <div className="w-[180px]">
                    <Select defaultValue="visual">
                        <option value="visual">Visual Editor</option>
                        <option value="markdown">Markdown Editor</option>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Autosave</Label>
                    <p className="text-sm text-muted-foreground">
                        Automatically save your content while you type.
                    </p>
                </div>
                <Switch checked={autosave} onCheckedChange={() => setAutosave(!autosave)} />
            </div>

             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Autosave Interval</Label>
                    <p className="text-sm text-muted-foreground">
                        How often to save your changes (in seconds).
                    </p>
                </div>
                <div className="w-[180px]">
                     <Select defaultValue="30" disabled={!autosave}>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Spellcheck</Label>
                    <p className="text-sm text-muted-foreground">
                        Enable native browser spellchecker in the editor.
                    </p>
                </div>
                <Switch checked={spellcheck} onCheckedChange={() => setSpellcheck(!spellcheck)} />
            </div>
            
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Default Font</Label>
                    <p className="text-sm text-muted-foreground">
                        Select the font family for the editor content.
                    </p>
                </div>
                <div className="w-[180px]">
                    <Select defaultValue="sans">
                        <option value="sans">Sans Serif (Inter)</option>
                        <option value="serif">Serif (Merriweather)</option>
                        <option value="mono">Monospace (JetBrains Mono)</option>
                    </Select>
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <Button onClick={onSave} disabled={loading}>
                {loading ? "Saving..." : "Save preferences"}
            </Button>
        </div>
      </div>
    </div>
  )
}
