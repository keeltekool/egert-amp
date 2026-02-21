"use client";

import { useState } from "react";
import { MusicNoteIcon } from "@/components/ui/icons";
import { getArtUrl } from "@/lib/drive";

interface AlbumArtProps {
  fileId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-10 h-10", icon: "w-4 h-4" },
  md: { container: "w-14 h-14", icon: "w-6 h-6" },
  lg: { container: "w-full aspect-square max-w-[300px]", icon: "w-24 h-24" },
};

export function AlbumArt({ fileId, size = "sm", className = "" }: AlbumArtProps) {
  const [failed, setFailed] = useState(false);
  const s = sizeMap[size];

  if (failed) {
    return (
      <div className={`${s.container} rounded-lg bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0 ${className}`}>
        <MusicNoteIcon className={`${s.icon} text-[var(--text-icon)]`} />
      </div>
    );
  }

  return (
    <div className={`${s.container} rounded-lg bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}>
      <img
        src={getArtUrl(fileId)}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
