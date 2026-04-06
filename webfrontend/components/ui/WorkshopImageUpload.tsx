import React, { useRef, useState } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkshopImageUploadProps {
  label?: string;
  value: string; // base64 or URL
  onChange: (value: string, file?: File | null) => void;
  onError?: (error: string) => void;
  className?: string;
  shape?: "square" | "rectangle";
}

export function WorkshopImageUpload({
  label = "Upload Image",
  value,
  onChange,
  onError,
  className,
  shape = "square"
}: WorkshopImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      onError?.("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        onChange(e.target.result, file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className={cn("text-xs font-medium text-foreground", shape === "square" && "text-center")}>
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
          shape === "square" ? "aspect-square w-48 sm:w-56 mx-auto" : "min-h-[140px] w-full",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30",
          value && "border-transparent bg-transparent"
        )}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !value && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        
        {value ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden group">
            <img src={value} alt="Uploaded preview" className="w-full h-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-semibold rounded-md transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange("", null); }}
                className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 backdrop-blur text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
              >
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
              <UploadCloud size={20} />
            </div>
            <p className="text-sm font-medium">Click or drag image here</p>
            <p className="text-xs opacity-60">JPEG, PNG, WebP up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
