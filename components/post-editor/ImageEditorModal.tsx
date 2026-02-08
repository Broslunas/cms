import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import Modal from '../Modal'
import { Button } from '@/components/ui/button'

import getCroppedImg from '@/lib/cropImage'
import { RotateCw, ZoomIn, Check, X, RotateCcw, FileDown } from 'lucide-react'

interface ImageEditorModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onSave: (croppedBlob: Blob) => void
  fileName: string
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  fileName,
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [quality, setQuality] = useState(0.8)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [aspect, setAspect] = useState<number | undefined>(undefined) // Free by default
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [highQualityBlob, setHighQualityBlob] = useState<Blob | null>(null)
  const [originalSize, setOriginalSize] = useState<number>(0)
  
  const [viewMode, setViewMode] = useState<'edit' | 'compare'>('edit')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [highQualityUrl, setHighQualityUrl] = useState<string | null>(null)


  useEffect(() => {
    // Determine original size roughly from blob... actually imageSrc might be objectURL
    // We can fetch it to get size if it's a blob url
    if (imageSrc.startsWith('blob:')) {
        fetch(imageSrc).then(r => r.blob()).then(b => setOriginalSize(b.size));
    }
  }, [imageSrc]);

  // Cleanup URLs
  useEffect(() => {
     return () => {
         if (previewUrl) URL.revokeObjectURL(previewUrl)
         if (highQualityUrl) URL.revokeObjectURL(highQualityUrl)
     }
  }, [previewUrl, highQualityUrl])

  const updatePreview = useCallback(async () => {
      if (!croppedAreaPixels) return
      try {
          // Compressed Blob
          const blob = await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            rotation,
            { horizontal: false, vertical: false }, // flip
            { quality, type: 'image/jpeg' } 
          )
          setPreviewBlob(blob)
          if (blob) {
              const url = URL.createObjectURL(blob)
              setPreviewUrl(prev => {
                  if (prev) URL.revokeObjectURL(prev)
                  return url
              })
          }
          
          // Original High Quality Blob (only if not created yet or crop changed significantly? No, just create it)
          // We only strictly *need* this when entering comparison mode, but generating it eagerly is smoother for UI if efficient enough.
          // To save resources, let's only generate if we are in 'compare' mode OR about to save. 
          // Actually, let's generate it here for simplicity, but maybe debounce more heavily?
          // Let's generate it.
           const hqBlob = await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            rotation,
             { horizontal: false, vertical: false },
            { quality: 1, type: 'image/jpeg' } // Use jpeg at 100 or png? image/jpeg 1 is usually close enough to "original" for comparison context on photos
          )
          setHighQualityBlob(hqBlob)
           if (hqBlob) {
              const url = URL.createObjectURL(hqBlob)
              setHighQualityUrl(prev => {
                  if (prev) URL.revokeObjectURL(prev)
                  return url
              })
          }

      } catch (e) {
          console.error(e)
      }
  }, [croppedAreaPixels, rotation, quality, imageSrc])

  // Debounce preview update
  useEffect(() => {
      const timer = setTimeout(() => {
          updatePreview()
      }, 500)
      return () => clearTimeout(timer)
  }, [updatePreview])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
  }
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
  }

  const handleSave = async () => {
      if (previewBlob) {
          onSave(previewBlob)
      } else {
        // Fallback if preview not ready
         const blob = await getCroppedImg(
            imageSrc,
            croppedAreaPixels!,
            rotation,
             { horizontal: false, vertical: false },
            { quality, type: 'image/jpeg' }
          )
          if(blob) onSave(blob);
      }
      onClose()
  }

  const AspectRatioButton = ({ value, label }: { value: number | undefined; label: string }) => (
    <button
      onClick={() => setAspect(value)}
      className={`px-3 py-1.5 text-xs rounded transition-colors border ${
        aspect === value
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Image"
      description={`Make adjustments to ${fileName} before uploading.`}
      className="max-w-4xl w-full"
      footer={
        <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose} size="sm">
                Cancel
            </Button>
            <Button onClick={handleSave} size="sm" className="gap-2">
                <Check className="w-4 h-4" />
                Apply & Use
            </Button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 md:h-[60vh] max-h-[80vh] overflow-y-auto md:overflow-visible">
        {/* Editor Area */}
        <div className="w-full md:flex-1 h-[350px] md:h-full relative bg-black/5 rounded-lg overflow-hidden border border-border shrink-0 group">
          {viewMode === 'edit' ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{
                    containerClassName: "bg-checkerboard",
                }}
              />
          ) : (
             <div className="relative w-full h-full bg-checkerboard flex items-center justify-center">
                 {!previewBlob || !highQualityBlob ? (
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                         <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                         <span className="text-xs">Generating preview...</span>
                     </div>
                 ) : (
                     <div 
                        className="relative w-full h-full select-none overflow-hidden flex items-center justify-center"
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                     >
                         {/* We need to display the images fitted within the container, preserving aspect ratio */}
                         {/* Base Image (Compressed - Right Side usually, but let's say "After" is revealed by slider) */}
                         {/* Let's say Left is Original, Right is Compressed. Slider moves. */}
                         
                         {/* To ensure they align perfectly, we use specific styling */}
                         {/* Container for images */}
                         <div className="relative max-w-full max-h-full" style={{ aspectRatio: `${previewBlob ? 1 : 'auto'}` }}> 
                            {/* Actually getting aspect ratio here is hard without reading dimensions. 
                                Let's just use an img tag for sizing and absolute positioning for the comparison. 
                                Better: Use background images or simply two stacked images with clip-path. 
                            */}
                             <img 
                                src={highQualityUrl || ''} 
                                alt="Original" 
                                className="max-w-full max-h-full object-contain block opacity-0" // Invisible spacer to set size
                                onLoad={(e) => {
                                   // Keep aspect ratio for container if needed?
                                }}
                             />
                             
                             {/* Images Positioned Absolutely over the spacer */}
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {/* Compressed (Background) */}
                                 <img 
                                    src={previewUrl || ''} 
                                    className="max-w-full max-h-full object-contain" 
                                    alt="Compressed"
                                    draggable={false}
                                 />
                                 
                                 {/* Original (Foreground - Clipped) */}
                                 <div 
                                    className="absolute inset-0 overflow-hidden" 
                                    style={{ width: `${sliderPosition}%` }}
                                 >
                                    <div className="w-full h-full relative flex items-center justify-center">
                                         {/* We need the image to appear "full width" relative to the parent container, not the clipped container. 
                                            This is tricky with object-contain. 
                                            Easier solution: Use a specific container with fixed aspect ratio calculated from preview. 
                                         */}
                                         {/* Let's try a different approach: Two divs with background-image: contain/cover? No, crop might vary. */}
                                         
                                         {/* Robust approach: 
                                            Use the spacer image logic but for the clipped container too?
                                            No, let's just use valid CSS clip-path or width masking on the wrapper. 
                                            If we use width masking on a wrapper, the inner image must be calculated to be full width of the PARENT, not the wrapper.
                                         */}
                                        <img 
                                            src={highQualityUrl || ''} 
                                            className="max-w-full max-h-full object-contain" 
                                            alt="Original"
                                            draggable={false}
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                maxWidth: 'none', 
                                                maxHeight: 'none',
                                                // We need to match the parent's centered image exactly.
                                                // This is surprisingly hard with object-contain and centering.
                                                // Let's assume the user wants to see the comparison.
                                            }}
                                         />
                                          {/* WAIT. The above approach breaks with object-contain centering. 
                                              Refined approach: 
                                              Just render the "Original" image fully. 
                                              And render the "Compressed" image fully on top.
                                              Clip the "Compressed" image based on slider.
                                          */}
                                    </div>
                                 </div>
                                 
                                  {/* Actually correct implementation for object-contain comparison: */}
                                 <img 
                                     src={highQualityUrl || ''} 
                                     className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                                     alt="Original" 
                                 />
                                 <img 
                                     src={previewUrl || ''} 
                                     className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                                     style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
                                     alt="Compressed" 
                                 />


                                 {/* Slider Handle */}
                                 <div 
                                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 hover:bg-primary transition-colors"
                                    style={{ left: `${sliderPosition}%` }}
                                 >
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md">
                                        <div className="flex gap-0.5">
                                            <div className="w-0.5 h-3 bg-black/20 rounded-full" />
                                            <div className="w-0.5 h-3 bg-black/20 rounded-full" />
                                        </div>
                                     </div>
                                 </div>
                                 
                                 {/* Labels */}
                                 <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                                     Original
                                 </div>
                                 <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                                     Compressed
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
          )}
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-6 md:border-l border-border md:pl-6 md:overflow-y-auto shrink-0 pb-4 h-auto md:h-full">
            
            {/* Zoom Control */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><ZoomIn className="w-3 h-3"/> Zoom</span>
                    <span className="font-mono">{zoom.toFixed(1)}x</span>
                </label>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>

            {/* Rotation Control */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><RotateCw className="w-3 h-3"/> Rotation</span>
                    <span className="font-mono">{rotation}°</span>
                </label>
                <input
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between">
                    <button onClick={() => setRotation((r) => Math.max(0, r - 90))} className="p-1 rounded hover:bg-muted text-muted-foreground" title="-90°">
                        <RotateCcw className="w-3 h-3" />
                    </button>
                    <button onClick={() => setRotation((r) => Math.min(360, r + 90))} className="p-1 rounded hover:bg-muted text-muted-foreground" title="+90°">
                        <RotateCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Compression Control */}
            <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                 <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileDown className="w-3 h-3"/> Compression (Quality)</span>
                    <span className="font-mono">{Math.round(quality * 100)}%</span>
                </label>
                <input
                    type="range"
                    value={quality}
                    min={0.1}
                    max={1}
                    step={0.05}
                    aria-labelledby="Quality"
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <div className="flex flex-col">
                        <span>Original</span>
                        <span className="font-mono font-medium text-foreground">{formatSize(originalSize)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span>New (Est.)</span>
                        <span className={`font-mono font-medium ${previewBlob && previewBlob.size < originalSize ? 'text-green-500' : 'text-foreground'}`}>
                            {previewBlob ? formatSize(previewBlob.size) : 'Calculating...'}
                        </span>
                    </div>
                </div>
                 {previewBlob && originalSize > 0 && (
                    <div className="text-[10px] text-center text-green-600 dark:text-green-400 font-medium bg-green-500/10 rounded px-1 py-0.5 mt-1">
                        -{Math.round(((originalSize - previewBlob.size) / originalSize) * 100)}% saved
                    </div>
                )}
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <AspectRatioButton value={undefined} label="Free" />
                    <AspectRatioButton value={1} label="Square (1:1)" />
                    <AspectRatioButton value={16 / 9} label="16:9" />
                    <AspectRatioButton value={4 / 3} label="4:3" />
                    <AspectRatioButton value={3 / 2} label="3:2" />
                    <AspectRatioButton value={2 / 1} label="2:1" />
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted p-1 rounded-lg">
                <button
                    onClick={() => setViewMode('edit')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'edit'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Edit & Crop
                </button>
                <button
                    onClick={() => setViewMode('compare')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'compare'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Compare Quality
                </button>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                    Drag to move. Scroll to zoom.
                </p>
            </div>
        </div>
      </div>
    </Modal>
  )
}
