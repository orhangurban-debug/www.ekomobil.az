import Image, { type ImageProps } from "next/image";

const WATERMARK_SRC = "/brand/ekomobil-mark.png";

type ListingPhotoProps = Omit<ImageProps, "alt"> & {
  alt: string;
  /** Kiçik thumbnail-lərdə loqo gizlədilir */
  showWatermark?: boolean;
};

/**
 * Saytda göstərilən elan şəkilləri — sağ alt küncdə EkoMobil nişanı.
 * Server tərəfində də loqo vurulur; bu overlay köhnə şəkillər və kart önbaxışı üçündür.
 */
export function ListingPhoto({ alt, className, showWatermark = true, fill, ...props }: ListingPhotoProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized = src.startsWith("data:") || src.startsWith("/api/");

  return (
    <div className={`relative ${fill ? "h-full w-full" : ""}`}>
      <Image alt={alt} className={className} fill={fill} unoptimized={unoptimized} {...props} />
      {showWatermark && (
        <div
          className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center justify-center rounded-md bg-black/35 px-1 py-0.5 backdrop-blur-[1px] sm:bottom-2 sm:right-2"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WATERMARK_SRC}
            alt=""
            className="h-4 w-4 object-contain opacity-90 sm:h-5 sm:w-5 md:h-6 md:w-6"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
