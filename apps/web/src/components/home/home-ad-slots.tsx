import { AdBanner, AdSlotRow, NativeAdCard } from "@/components/ads/ad-banner";
import type { AdSlotsConfig } from "@/lib/ad-slots-config";
import { getAdSlotById } from "@/lib/ad-slots-config";

/**
 * Ana səhifə reklam yerləri — IAB standart layout
 */

interface HomeAdSlotsProps {
  config: AdSlotsConfig;
}

export function HomeTopAdSlot({ config }: HomeAdSlotsProps) {
  const desktop = getAdSlotById(config, "home-top-leaderboard");
  const mobile = getAdSlotById(config, "home-top-mobile");
  if (!desktop?.enabled && !mobile?.enabled) return null;

  return (
    <AdSlotRow>
      {desktop?.enabled && (
        <div className="hidden sm:block">
          <AdBanner size="leaderboard" slotConfig={desktop} />
        </div>
      )}
      {mobile?.enabled && (
        <div className="sm:hidden">
          <AdBanner size="mobile" slotConfig={mobile} />
        </div>
      )}
    </AdSlotRow>
  );
}

export function HomeMidAdSlot({ config }: HomeAdSlotsProps) {
  const slot = getAdSlotById(config, "home-mid-wide");
  if (!slot?.enabled) return null;
  return (
    <AdSlotRow>
      <AdBanner size="wide" slotConfig={slot} />
    </AdSlotRow>
  );
}

export function HomeListingsNativeAd({ config }: HomeAdSlotsProps) {
  const slot = getAdSlotById(config, "home-listings-native");
  if (!slot?.enabled) return null;
  return <NativeAdCard slotConfig={slot} />;
}

export function HomeBottomAdSlot({ config }: HomeAdSlotsProps) {
  const slot = getAdSlotById(config, "home-bottom-leaderboard");
  if (!slot?.enabled) return null;
  return (
    <AdSlotRow>
      <AdBanner size="leaderboard" slotConfig={slot} />
    </AdSlotRow>
  );
}
