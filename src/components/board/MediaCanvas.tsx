"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import {
  useAnnotationHandlers,
  AnnotationRenderer,
} from "./AnnotationLayer";
import { useBoardStore } from "@/stores/boardStore";
import type { KonvaEventObject } from "konva/lib/Node";

export default function MediaCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const uploadedImage = useBoardStore((s) => s.uploadedImage);
  const setUploadedImage = useBoardStore((s) => s.setUploadedImage);
  const activeTool = useBoardStore((s) => s.activeTool);

  const {
    annotations,
    currentDrawing,
    textInput,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    submitText,
  } = useAnnotationHandlers();

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    setDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  // Load image when uploadedImage changes
  useEffect(() => {
    if (!uploadedImage) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      // Fit image within canvas
      const scale = Math.min(
        dimensions.width / img.width,
        dimensions.height / img.height
      );
      const w = img.width * scale;
      const h = img.height * scale;
      setImageLayout({
        x: (dimensions.width - w) / 2,
        y: (dimensions.height - h) / 2,
        width: w,
        height: h,
      });
    };
    img.src = uploadedImage;
  }, [uploadedImage, dimensions]);

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const cursorStyle = activeTool === "select" ? "default" : "crosshair";

  if (!uploadedImage) {
    return (
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden flex items-center justify-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p className="text-lg">Drop an image here or click to upload</p>
          <label className="px-4 py-2 bg-surface-light border border-border rounded cursor-pointer hover:bg-border transition-colors">
            Choose File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={(e: KonvaEventObject<MouseEvent>) => handleMouseDown(e)}
        onMouseMove={(e: KonvaEventObject<MouseEvent>) => handleMouseMove(e)}
        onMouseUp={() => handleMouseUp()}
      >
        {/* Layer 1: Uploaded image */}
        <Layer listening={false}>
          {image && (
            <KonvaImage
              image={image}
              x={imageLayout.x}
              y={imageLayout.y}
              width={imageLayout.width}
              height={imageLayout.height}
            />
          )}
        </Layer>

        {/* Layer 2: Annotations */}
        <Layer>
          <AnnotationRenderer
            annotations={annotations}
            currentDrawing={currentDrawing}
          />
        </Layer>
      </Stage>

      {/* Text input overlay */}
      {textInput && (
        <input
          type="text"
          autoFocus
          className="absolute bg-surface border border-border text-foreground px-2 py-1 text-sm rounded outline-none focus:border-accent"
          style={{ left: textInput.x, top: textInput.y, minWidth: 100 }}
          placeholder="Type text..."
          onKeyDown={(e) => {
            if (e.key === "Enter") submitText(e.currentTarget.value);
            if (e.key === "Escape") submitText("");
          }}
          onBlur={(e) => submitText(e.currentTarget.value)}
        />
      )}
    </div>
  );
}
