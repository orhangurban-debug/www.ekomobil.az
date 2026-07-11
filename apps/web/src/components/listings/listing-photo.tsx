import Image, { type ImageProps } from "next/image";
import { LISTING_WATERMARK, listingWatermarkOverlayClassName } from "@/lib/listing-watermark";

type ListingPhotoProps = Omit<ImageProps, "alt"> & {
  alt: string;
  /** Kiçik thumbnail-lərdə loqo gizlədilir */
  showWatermark?: boolean;
};

/**
 * Saytda göstərilən elan şəkilləri — sağ alt küncdə şəffaf EkoMobil wordmark.
 * Server tərəfində loqo şəkil faylına yazılır (paylaşım üçün).
 * `showWatermark` yalnız köhnə/önizləmə şəkilləri üçün — default false.
 */
export function ListingPhoto({ alt, className, showWatermark = false, fill, ...props }: ListingPhotoProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized = src.startsWith("data:") || src.startsWith("/api/");

  return (
    <div className={fill ? "absolute inset-0" : "relative"}>
      <Image
        alt={alt}
        className={fill ? `h-full w-full object-cover object-center ${className ?? ""}`.trim() : className}
        fill={fill}
        unoptimized={unoptimized}
        {...props}
      />
      {showWatermark && (
        <div className={listingWatermarkOverlayClassName()} aria-hidden>
          <div
            className="rounded-lg px-2 py-1 backdrop-blur-[1px] sm:px-2.5 sm:py-1.5"
            style={{ backgroundColor: `rgba(8, 15, 30, ${LISTING_WATERMARK.backdropOpacity})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LISTING_WATERMARK.publicSrc}
              alt=""
              className="h-3.5 w-auto max-w-[5.5rem] object-contain sm:h-4 sm:max-w-[6.5rem] md:h-5 md:max-w-[8rem]"
              style={{ opacity: LISTING_WATERMARK.opacity }}
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
