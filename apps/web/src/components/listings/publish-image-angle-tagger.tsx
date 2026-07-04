"use client";

import { useState } from "react";
import { formatFileSize, type ProcessedImage } from "@/lib/image-processor";
import type { MediaProtocolInput } from "@/lib/media-protocol";
import {
  IMAGE_PHOTO_TAG_OPTIONS,
  PHOTO_TAG_GROUPS,
  PROTOCOL_REQUIREMENT_OPTIONS,
  photoTagLabel,
  type ImagePhotoTag,
  type PhotoTagGroupId
} from "@/lib/vehicle-media-angles";

interface PublishImageAngleTaggerProps {
  uploadedImages: ProcessedImage[];
  imageAngleTags: Array<ImagePhotoTag | null>;
  media: MediaProtocolInput;
  maxImages: number;
  planNameAz?: string;
  minimumRequiredImages: number;
  uploadProcessing: boolean;
  uploadErrors: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectFiles: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onAssignAngle: (index: number, angle: ImagePhotoTag | null) => void;
  compact?: boolean;
}

const GROUP_ICONS: Record<PhotoTagGroupId, string> = {
  xarici: "🚗",
  salon: "💺",
  texniki: "🔧",
  elave: "📎"
};

// Visual icon/emoji for each tag — makes chips instantly scannable
const TAG_ICONS: Partial<Record<ImagePhotoTag, string>> = {
  exterior_front:       "⬆️",
  exterior_rear:        "⬇️",
  exterior_left:        "⬅️",
  exterior_right:       "➡️",
  exterior_front_left:  "↖️",
  exterior_front_right: "↗️",
  exterior_rear_left:   "↙️",
  exterior_rear_right:  "↘️",
  interior_dashboard:   "🎛️",
  interior_front_seats: "💺",
  interior_rear_seats:  "🪑",
  interior_ceiling:     "🌙",
  odometer:             "🔢",
  trunk:                "📦",
  engine:               "⚙️",
  wheel:                "🔵",
  detail_damage:        "⚠️",
  other:                "📷"
};

function TagChip({
  tag,
  selected,
  onSelect
}: {
  tag: { id: ImagePhotoTag; shortLabel: string; hint: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={tag.hint}
      onClick={onSelect}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 ${
        selected
          ? "border-[#0057FF] bg-[#0057FF] text-white shadow-sm shadow-[#0057FF]/30"
          : "border-slate-200 bg-white/80 text-slate-700 hover:border-[#0057FF]/50 hover:bg-[#0057FF]/8 hover:text-[#0057FF]"
      }`}
    >
      <span className="text-[13px] leading-none">{TAG_ICONS[tag.id] ?? "📷"}</span>
      <span>{tag.shortLabel}</span>
      {selected && (
        <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

function ImageTagCard({
  img,
  index,
  selectedTag,
  onRemove,
  onAssignAngle
}: {
  img: ProcessedImage;
  index: number;
  selectedTag: ImagePhotoTag | null;
  onRemove: () => void;
  onAssignAngle: (tag: ImagePhotoTag | null) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<PhotoTagGroupId | "all">("xarici");

  const displayGroups = PHOTO_TAG_GROUPS;
  const tagsByGroup = (gId: PhotoTagGroupId) =>
    IMAGE_PHOTO_TAG_OPTIONS.filter((t) => t.group === gId);

  // Show all if the selected tag is in a non-active group
  const effectiveGroup: PhotoTagGroupId | null = activeGroup === "all" ? null : activeGroup;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        selectedTag
          ? "border-[#0057FF]/25 bg-gradient-to-br from-[#0057FF]/[0.03] to-white/90 shadow-sm"
          : "border-amber-300/70 bg-amber-50/60"
      }`}
    >
      {/* Image row */}
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-900/10 bg-slate-100 shadow-sm sm:h-28 sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(img.file)}
            alt={`Şəkil ${index + 1}`}
            className="h-full w-full object-cover"
          />
          {selectedTag ? (
            <div className="absolute inset-x-0 bottom-0 bg-[#0057FF]/90 px-1.5 py-1 text-center">
              <span className="text-[10px] font-bold leading-none text-white">
                {TAG_ICONS[selectedTag]} {photoTagLabel(selectedTag)}
              </span>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 bg-amber-500/85 px-1.5 py-1 text-center">
              <span className="text-[10px] font-bold leading-none text-white">Seçilməyib</span>
            </div>
          )}
          <button
            type="button"
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white shadow transition hover:bg-black/80"
            onClick={onRemove}
            aria-label="Şəkli sil"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-slate-800">Şəkil {index + 1}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {formatFileSize(img.compressedSizeBytes)}
            </span>
          </div>

          {selectedTag ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-sm">{TAG_ICONS[selectedTag]}</span>
              <span className="text-sm font-medium text-[#0057FF]">{photoTagLabel(selectedTag)}</span>
              <button
                type="button"
                onClick={() => onAssignAngle(null)}
                className="ml-auto text-[11px] text-slate-400 hover:text-red-500"
              >
                Sil
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-amber-700">👆 Aşağıdan şəkil növünü seçin</p>
          )}
        </div>
      </div>

      {/* Tag selector */}
      <div className="border-t border-slate-900/8 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4">
        {/* Group tabs */}
        <div className="mb-2.5 flex gap-1 overflow-x-auto">
          {displayGroups.map((g) => {
            const groupHasSelection = tagsByGroup(g.id).some((t) => t.id === selectedTag);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroup(g.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  activeGroup === g.id
                    ? "border-slate-700 bg-slate-800 text-white"
                    : groupHasSelection
                      ? "border-[#0057FF]/30 bg-[#0057FF]/8 text-[#0057FF]"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{GROUP_ICONS[g.id]}</span>
                <span>{g.label}</span>
                {groupHasSelection && (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-1.5">
          {IMAGE_PHOTO_TAG_OPTIONS.filter((t) =>
            effectiveGroup === null ? true : t.group === effectiveGroup
          ).map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedTag === tag.id}
              onSelect={() => onAssignAngle(selectedTag === tag.id ? null : tag.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PublishImageAngleTagger({
  uploadedImages,
  imageAngleTags,
  media,
  maxImages,
  planNameAz,
  uploadProcessing,
  uploadErrors,
  fileInputRef,
  onSelectFiles,
  onRemoveImage,
  onAssignAngle,
  compact = false
}: PublishImageAngleTaggerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const taggedCount = imageAngleTags.filter(Boolean).length;
  const untaggedCount = uploadedImages.length - taggedCount;
  const completedRequirements = PROTOCOL_REQUIREMENT_OPTIONS.filter((item) => media[item.key]).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="label mb-0">Şəkillər</label>
          <div className="flex items-center gap-2">
            {uploadedImages.length > 0 && (
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                untaggedCount > 0
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
              }`}>
                {taggedCount}/{uploadedImages.length} təsnif edilib
              </span>
            )}
            <span className="text-xs text-slate-400">
              {uploadedImages.length}/{maxImages}
              {planNameAz && <span className="ml-1 text-slate-300">({planNameAz})</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Protocol progress bar (compact chips) */}
      {uploadedImages.length > 0 && (
        <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-3 sm:p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">Zəruri şəkil növləri</p>
            <span className="rounded-full bg-[#0057FF]/10 px-2 py-0.5 text-[11px] font-bold text-[#0057FF]">
              {completedRequirements}/{PROTOCOL_REQUIREMENT_OPTIONS.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROTOCOL_REQUIREMENT_OPTIONS.map((item) => {
              const done = media[item.key];
              return (
                <span
                  key={item.key}
                  title={item.hint}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    done
                      ? "border-emerald-300 bg-emerald-500/10 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {done ? (
                    <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  )}
                  {item.shortLabel}
                </span>
              );
            })}
          </div>
          {untaggedCount > 0 && (
            <p className="mt-2 text-[11px] text-amber-600">
              {untaggedCount} şəkil üçün növ seçilməyib — aşağıdakı kartlarda seçin.
            </p>
          )}
        </div>
      )}

      {/* Upload drop zone */}
      <div
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200 ${
          compact ? "min-h-[112px] p-4" : "min-h-[148px] p-6"
        } ${
          uploadProcessing
            ? "border-[#0057FF]/50 bg-[#0057FF]/8 shadow-inner"
            : isDragging
              ? "scale-[1.01] border-[#0057FF] bg-[#0057FF]/12 shadow-lg shadow-[#0057FF]/20"
              : "border-[#0057FF]/40 bg-gradient-to-b from-[#0057FF]/[0.07] via-white/70 to-white/80 hover:border-[#0057FF] hover:bg-[#0057FF]/10 hover:shadow-md hover:shadow-[#0057FF]/15 active:scale-[0.99]"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); onSelectFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => onSelectFiles(e.target.files)}
        />
        {uploadProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0057FF]/15">
              <svg className="h-5 w-5 animate-spin text-[#0057FF]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#0057FF]">Şəkillər sıxılır…</p>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-center rounded-full bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/30 transition-transform duration-200 group-hover:scale-105 ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
              <svg className={compact ? "h-5 w-5" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span className="btn-primary pointer-events-none px-5 py-2.5 text-sm shadow-[0_6px_20px_rgba(0,87,255,0.35)] group-hover:shadow-[0_8px_24px_rgba(0,87,255,0.45)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {uploadedImages.length > 0 ? "Daha çox şəkil əlavə et" : "Şəkil yüklə"}
            </span>
            <p className="text-sm text-slate-600">
              {isDragging ? (
                <span className="font-semibold text-[#0057FF]">Buraxın — şəkillər əlavə olunacaq</span>
              ) : (
                <>və ya faylları bura <span className="font-medium text-slate-700">sürükləyin</span></>
              )}
            </p>
            <p className="text-xs text-slate-400">JPEG · PNG · WebP · HEIC — sistem avtomatik sıxır</p>
          </>
        )}
      </div>

      {/* Error messages */}
      {uploadErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          {uploadErrors.map((error, index) => (
            <p key={index} className="text-xs text-red-700">{error}</p>
          ))}
        </div>
      )}

      {/* Image cards with visual tag picker */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          {uploadedImages.map((img, index) => (
            <ImageTagCard
              key={`${img.file.name}-${index}`}
              img={img}
              index={index}
              selectedTag={imageAngleTags[index] ?? null}
              onRemove={() => onRemoveImage(index)}
              onAssignAngle={(tag) => onAssignAngle(index, tag)}
            />
          ))}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <p className="text-[11px] text-slate-400">
          Cəmi: {formatFileSize(uploadedImages.reduce((sum, img) => sum + img.compressedSizeBytes, 0))} · Sistem avtomatik JPEG 85%-ə çevirir
        </p>
      )}
    </div>
  );
}
