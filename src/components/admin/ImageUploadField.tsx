"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  DownloadCloud,
  FileImage,
} from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  aspectRatio?: "poster" | "banner";
  required?: boolean;
  className?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://... or upload local file",
  helperText,
  aspectRatio = "poster",
  required = false,
  className = "",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isLocalUpload = value.startsWith("/uploads/") || value.startsWith("/avatars/");
  const isChatGPT = value.includes("chatgpt.com");

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Direct File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showStatus("Please choose a valid image file (JPG, PNG, WebP, GIF, SVG).", "error");
      return;
    }

    try {
      setIsUploading(true);
      setImageError(false);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image file.");
      }

      onChange(data.url);
      showStatus(`Uploaded "${file.name}" successfully!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      showStatus(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Import / Cache remote URL to local disk
  const handleImportRemoteUrl = async () => {
    if (!value || (!value.startsWith("http://") && !value.startsWith("https://"))) {
      showStatus("Please enter a valid HTTP/HTTPS URL first.", "error");
      return;
    }

    try {
      setIsImporting(true);
      setImageError(false);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not import remote image.");
      }

      onChange(data.url);
      showStatus("Imported & cached image on server successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failure";
      showStatus(msg, "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };



  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#8E8E93] inline-flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {isLocalUpload && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3 h-3" /> Stored Locally
          </span>
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-2">
        {/* Main URL / Path input with upload trigger */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setImageError(false);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            required={required}
            className="w-full bg-[#181A24] border border-white/10 rounded-xl pl-3.5 pr-24 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5500] transition-colors"
          />

          <div className="absolute right-1.5 flex items-center space-x-1">
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1 rounded-md text-[#8E8E93] hover:text-white hover:bg-white/10"
                title="Clear image URL"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Browse File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1.5 rounded-lg bg-[#FF5500]/20 hover:bg-[#FF5500]/30 text-[#FF5500] border border-[#FF5500]/40 text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl p-2.5 text-center transition-all ${
            dragActive
              ? "border-[#FF5500] bg-[#FF5500]/10 text-white"
              : "border-white/10 hover:border-white/20 bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8E8E93]">
            <span className="flex items-center gap-1.5">
              <Upload className="w-3 h-3 text-[#FF5500]" />
              <span>Drag & drop image file here, or click Upload</span>
            </span>

            {/* Import from remote URL button */}
            {value && value.startsWith("http") && (
              <button
                type="button"
                onClick={handleImportRemoteUrl}
                disabled={isImporting || isLocalUpload}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center space-x-1 transition-all disabled:opacity-40"
                title="Download and cache remote image permanently on local server"
              >
                {isImporting ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-[#FF5500]" />
                ) : (
                  <DownloadCloud className="w-3 h-3 text-cyan-400" />
                )}
                <span>{isLocalUpload ? "Cached" : "Import & Save to Server"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ChatGPT specific assistance note */}
        {isChatGPT && !isLocalUpload && (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>ChatGPT links require server caching or direct file upload to prevent cross-origin blocks.</span>
            </span>
            <button
              type="button"
              onClick={handleImportRemoteUrl}
              disabled={isImporting}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[10px]"
            >
              {isImporting ? "Importing..." : "Cache Now"}
            </button>
          </div>
        )}

        {/* Status feedback */}
        {statusMessage && (
          <div
            className={`text-[11px] font-medium flex items-center gap-1.5 ${
              statusMessage.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {helperText && <p className="text-[11px] text-[#8E8E93]">{helperText}</p>}
      </div>

      {/* Compact Live Preview */}
      <div className="flex items-center gap-3">
        <div className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-[#0A0B10] border border-white/10 shadow-md group ${aspectRatio === "poster" ? "w-20 h-[120px]" : "w-40 h-[90px]"}`}>
          {value && !imageError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="p-1 rounded-full bg-red-600/80 text-white hover:bg-red-600"
                  title="Remove Image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-400 space-y-1 p-1">
              <AlertCircle className="w-4 h-4" />
              <button
                type="button"
                onClick={handleImportRemoteUrl}
                className="text-[9px] underline text-white hover:text-[#FF5500]"
              >
                Import
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8E93] space-y-1">
              <FileImage className="w-5 h-5 opacity-30" />
              <span className="text-[9px] opacity-50">No Preview</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#8E8E93] font-mono">
          {aspectRatio === "poster" ? "2:3 Poster" : "16:9 Banner"}
        </span>
      </div>
    </div>
  );
}
