"use client";

import { formatFileSize, type ProcessedImage } from "@/lib/image-processor";
import type { MediaProtocolInput } from "@/lib/media-protocol";
import {
  IMAGE_PHOTO_TAG_OPTIONS,
  PHOTO_TAG_GROUPS,
  PROTOCOL_REQUIREMENT_OPTIONS,
  photoTagLabel,
  photoTagOption,
  type ImagePhotoTag
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
  const taggedCount = imageAngleTags.filter(Boolean).length;
  const untaggedCount = uploadedImages.length - taggedCount;
  const completedRequirements = PROTOCOL_REQUIREMENT_OPTIONS.filter((item) => media[item.key]).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="label mb-0">Şəkillər</label>
          <span className="text-xs text-slate-400">
            {uploadedImages.length} / {maxImages} şəkil
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Telefondan şəkil yükləyin və hər birinin növünü seçin. Eyni növdən bir neçə şəkil əlavə edə bilərsiniz.
          {planNameAz ? (
            <span className="mt-1 block text-xs text-slate-500">
              «{planNameAz}» planı: maksimum {maxImages} şəkil · yayımlandıqdan sonra şəkillərin üzərinə EkoMobil loqosu əlavə olunur.
            </span>
          ) : null}
        </p>
      </div>

      {uploadedImages.length > 0 && (
        <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Əsas şəkil növləri</p>
            <span className="rounded-full bg-[#0057FF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0057FF]">
              {completedRequirements} / {PROTOCOL_REQUIREMENT_OPTIONS.length}
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
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {done ? (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  )}
                  {item.shortLabel}
                </span>
              );
            })}
          </div>
          {untaggedCount > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              {untaggedCount} şəkil üçün «bu şəkil nədir?» seçin.
            </p>
          )}
        </div>
      )}

      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition ${
          compact ? "min-h-[100px] p-4" : "min-h-[120px] p-5"
        } ${
          uploadProcessing
            ? "border-[#0057FF]/40 bg-[#0057FF]/5"
            : "border-slate-900/15 bg-white/60 hover:border-[#0057FF]/60 hover:bg-[#0057FF]/5"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onSelectFiles(e.dataTransfer.files);
        }}
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
          <div className="flex items-center gap-2 text-sm text-[#0057FF]">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Şəkillər sıxılır…
          </div>
        ) : (
          <>
            <svg className={`text-slate-400 ${compact ? "h-7 w-7" : "h-8 w-8"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-[#0057FF]">Fayl seçin</span> və ya bura sürükləyin
            </p>
            <p className="text-xs text-slate-400">JPEG · PNG · WebP · HEIC — sistem avtomatik sıxır</p>
          </>
        )}
      </div>

      {uploadErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          {uploadErrors.map((error, index) => (
            <p key={index} className="text-xs text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          {uploadedImages.map((img, index) => {
            const selectedTag = imageAngleTags[index] ?? null;

            return (
              <div
                key={`${img.file.name}-${index}`}
                className={`rounded-2xl border p-3 transition sm:p-4 ${
                  selectedTag
                    ? "border-[#0057FF]/25 bg-[#0057FF]/[0.03]"
                    : "border-amber-200/80 bg-amber-50/40"
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-900/10 bg-white sm:h-28 sm:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(img.file)} alt={`Şəkil ${index + 1}`} className="h-full w-full object-cover" />
                    {selectedTag && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-[#0057FF] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        {photoTagLabel(selectedTag)}
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      onClick={() => onRemoveImage(index)}
                      aria-label="Şəkli sil"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">Şəkil {index + 1}</p>
                      <span className="text-[11px] text-slate-400">{formatFileSize(img.compressedSizeBytes)}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-medium text-slate-600">Bu şəkil nədir?</span>

                      <select
                        className="input-field text-sm"
                        value={selectedTag ?? ""}
                        onChange={(e) =>
                          onAssignAngle(index, (e.target.value || null) as ImagePhotoTag | null)
                        }
                        aria-label={`Şəkil ${index + 1} növü`}
                      >
                        <option value="">Siyahıdan seçin…</option>
                        {PHOTO_TAG_GROUPS.map((group) => (
                          <optgroup key={group.id} label={group.label}>
                            {IMAGE_PHOTO_TAG_OPTIONS.filter((item) => item.group === group.id).map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <div className="space-y-2">
                        {PHOTO_TAG_GROUPS.map((group) => {
                          const groupOptions = IMAGE_PHOTO_TAG_OPTIONS.filter((item) => item.group === group.id);
                          return (
                            <div key={group.id}>
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {group.label}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {groupOptions.map((item) => {
                                  const active = selectedTag === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      title={item.hint}
                                      onClick={() => onAssignAngle(index, active ? null : item.id)}
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                                        active
                                          ? "border-[#0057FF] bg-[#0057FF] text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-[#0057FF]/40 hover:text-[#0057FF]"
                                      }`}
                                    >
                                      {item.shortLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {selectedTag ? (
                      <p className="text-[11px] text-slate-500">{photoTagOption(selectedTag)?.hint}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Salonun fərli yerlərindən, zədədən və ya təkərdən bir neçə şəkil əlavə edə bilərsiniz.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
