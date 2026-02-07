
import { useState } from "react";

interface SocialLinksEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  allowedNetworks?: string[]; // If provided, only these keys are allowed
}

const COMMON_NETWORKS = [
  { id: "instagram", label: "Instagram", icon: "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM16.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" }, // Simplified generic Instagram-like shape
  { id: "twitter", label: "Twitter / X", icon: "M18.258,3.266l-5.7,6.597L7.54,3.266H3l6.666,9.69L3,21.674h4.755l8.136-9.412l6.883,9.412h4.54L18.73,12.3l6.095-9.034H18.258 z M16.956,20.007h-1.467L6.685,4.787h1.575L16.956,20.007 z" }, // X logo path equivalent
  { id: "facebook", label: "Facebook", icon: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" },
  { id: "linkedin", label: "LinkedIn", icon: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" },
  { id: "github", label: "GitHub", icon: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
  { id: "youtube", label: "YouTube", icon: "M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" },
];

export function SocialLinksEditor({ value, onChange, allowedNetworks }: SocialLinksEditorProps) {
  // Ensure value is an object
  const cleanValue = typeof value === 'object' && value !== null ? value : {};
  const [newNetwork, setNewNetwork] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleChange = (network: string, url: string) => {
    onChange({ ...cleanValue, [network]: url });
  };

  const handleDelete = (network: string) => {
    const newValue = { ...cleanValue };
    delete newValue[network];
    onChange(newValue);
  };

  const handleAddCustom = () => {
    if (newNetwork && !cleanValue[newNetwork]) {
       handleChange(newNetwork.toLowerCase(), "");
       setNewNetwork("");
       setIsAdding(false);
    }
  };

  // Helper to get icon for a network key
  const getNetworkIcon = (key: string) => {
    const known = COMMON_NETWORKS.find(n => n.id === key.toLowerCase() || key.toLowerCase().includes(n.id));
    if (known) {
        return (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d={known.icon} />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
  };

  // Helper to get nice label
  const getNetworkLabel = (key: string) => {
    const known = COMMON_NETWORKS.find(n => n.id === key.toLowerCase() || key.toLowerCase().includes(n.id));
    return known ? known.label : key.charAt(0).toUpperCase() + key.slice(1);
  }

  const existingKeys = Object.keys(cleanValue);
  
  // Calculate available to add
  let networksToAdd: { id: string, label: string, icon?: string }[] = [];

  if (allowedNetworks !== undefined) {
      // If we have a restriction (even empty), show only those allowed
      if (allowedNetworks.length > 0) {
        networksToAdd = allowedNetworks
            .filter(k => !existingKeys.includes(k))
            .map(k => {
                const known = COMMON_NETWORKS.find(n => n.id === k);
                return known || { id: k, label: k.charAt(0).toUpperCase() + k.slice(1) };
            });
      } else {
        networksToAdd = [];
      }
  } else {
      // If no restriction, show common ones not added + allow custom
      networksToAdd = COMMON_NETWORKS.filter(n => !existingKeys.includes(n.id));
  }

  return (
    <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
        <div className="p-3 space-y-3">
            {existingKeys.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No social networks added.</p>
            )}
            
            {existingKeys.map((key) => (
                <div key={key} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded bg-background border border-input flex items-center justify-center text-muted-foreground shrink-0">
                        {getNetworkIcon(key)}
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={cleanValue[key]}
                            onChange={(e) => handleChange(key, e.target.value)}
                            placeholder={`${getNetworkLabel(key)} URL`}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 text-sm focus:border-ring focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => handleDelete(key)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
        
        <div className="bg-card/50 p-2 border-t border-border flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {!isAdding ? (
                <>
                {networksToAdd.map(network => (
                     <button
                        key={network.id}
                        onClick={() => handleChange(network.id, "")}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-background border border-input rounded hover:bg-muted text-foreground transition-colors shrink-0"
                     >
                        {network.icon && (
                            <span className="w-3 h-3 fill-current opacity-70">
                                <svg viewBox="0 0 24 24"><path d={network.icon} /></svg>
                            </span>
                        )}
                        {network.label}
                     </button>
                ))}
                
                {(!allowedNetworks || allowedNetworks.length === 0) && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-muted/50 border border-dashed border-border rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        + Other
                    </button>
                )}
                </>
            ) : (
                <div className="flex items-center gap-2 w-full">
                    <input
                        type="text"
                        value={newNetwork}
                        onChange={(e) => setNewNetwork(e.target.value)}
                        placeholder="Network name (e.g. tiktok)"
                        className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                             if (e.key === 'Enter') handleAddCustom();
                             if (e.key === 'Escape') setIsAdding(false);
                        }}
                    />
                    <button onClick={handleAddCustom} className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Add</button>
                    <button onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground px-2 py-1 hover:text-foreground">Cancel</button>
                </div>
            )}
        </div>
    </div>
  );
}
