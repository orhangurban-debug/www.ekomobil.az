/**
 * VIN Mənşə Müəyyənləşdirmə və Xarici Yoxlama Resurslari
 *
 * EkoMobil VIN-i özü yoxlamır və bu fəaliyyətin məsuliyyətini daşımır.
 * Bu modul yalnız alıcını rəsmi xarici resurslara yönləndirir.
 *
 * VIN strukturu (ISO 3779):
 *   1-3 simvol = WMI (Dünya İstehsalçı İdentifikatoru) — mənşə ölkəsi
 *   4-9 simvol = VDS (Avtomobil Descriptor Bölməsi)
 *   10-17 simvol = VIS (Avtomobil İdentifikator Bölməsi)
 */

export type VinRegion =
  | "north_america"
  | "europe"
  | "japan"
  | "korea"
  | "china"
  | "other";

export interface VinCheckLink {
  /** Xidmətin ingilis adı */
  name: string;
  /** Azərbaycanca qısa ad */
  nameAz: string;
  /** Birbaşa keçid — VIN artıq URL-ə əlavə olunub (mümkündürsə) */
  url: string;
  /** Xidmət ödənişsizdirsə true */
  free: boolean;
  /** Alıcıya nə verəcəyi — qısa Azərbaycanca açıqlama */
  descriptionAz: string;
}

export interface VinCheckResult {
  vin: string;
  region: VinRegion;
  regionLabelAz: string;
  links: VinCheckLink[];
}

const REGION_LABELS: Record<VinRegion, string> = {
  north_america: "Şimali Amerika (ABŞ / Kanada / Meksika)",
  europe: "Avropa",
  japan: "Yaponiya",
  korea: "Cənubi Koreya",
  china: "Çin",
  other: "Digər / Bilinməyən mənşə"
};

/** VIN-in ilk simvoluna əsasən istehsal bölgəsini müəyyən edir */
export function getVinRegion(vin: string): VinRegion {
  const ch = vin.charAt(0).toUpperCase();
  if (["1", "2", "3", "4", "5"].includes(ch)) return "north_america";
  if (ch === "J") return "japan";
  if (ch === "K") return "korea";
  if (ch === "L") return "china";
  // Avropa: S=UK, V=Fransa, W=Almaniya, X=Rusiya/digər, Y=İsveç/Finlandiya, Z=İtaliya
  if (["S", "V", "W", "X", "Y", "Z"].includes(ch)) return "europe";
  return "other";
}

/** Sadə format yoxlaması: 17 simvol, I/O/Q yoxdur */
export function isVinFormatValid(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/**
 * VIN üçün uyğun xarici yoxlama resurslari qaytarır.
 * Bütün linklər rəsmi dövlət qurumları və ya tanınmış kommersiya xidmətlərə aparır.
 * EkoMobil bu xidmətlərlə heç bir şəriklik münasibətinə malik deyil.
 */
export function getVinCheckLinks(vin: string): VinCheckResult {
  const region = getVinRegion(vin);
  const enc = encodeURIComponent(vin.toUpperCase());
  const links: VinCheckLink[] = [];

  // ── CarVertical: bütün bölgələr üçün, Azərbaycan dili dəstəyi ──────────
  links.push({
    name: "CarVertical",
    nameAz: "CarVertical",
    url: `https://www.carvertical.com/az/vehicle-history/${enc}`,
    free: false,
    descriptionAz:
      "Qəza tarixçəsi, sahib sayı, gömrük məlumatları — Azərbaycan dili dəstəklidir"
  });

  // ── Şimali Amerika (ABŞ / Kanada / Meksika) ───────────────────────────
  if (region === "north_america") {
    links.push({
      name: "NHTSA VIN Decoder",
      nameAz: "NHTSA — ABŞ Dövlət Agentliyi",
      url: `https://vpic.nhtsa.dot.gov/decoder/Decoder?divId=60&vin=${enc}`,
      free: true,
      descriptionAz:
        "ABŞ Milli Yol Hərəkəti Təhlükəsizliyi Agentliyi — istehsal məlumatları, geri çağırmalar (pulsuz)"
    });
    links.push({
      name: "NICB VINCheck",
      nameAz: "NICB — Oğurluq & Batıq Yoxlaması",
      url: "https://www.nicb.org/vincheck",
      free: true,
      descriptionAz:
        "ABŞ Sığorta Cinayətkarlığı Bürosu — avtomobilin oğurluq/batıq qeydiyyatı (pulsuz)"
    });
    links.push({
      name: "Carfax",
      nameAz: "Carfax",
      url: `https://www.carfax.com/vehicle-history-report/inputs/vin/${enc}`,
      free: false,
      descriptionAz:
        "Tam ABŞ / Kanada avtomobil tarixçəsi — qəzalar, xidmət, sahib dəyişiklikləri"
    });
    links.push({
      name: "AutoCheck",
      nameAz: "AutoCheck (Experian)",
      url: `https://www.autocheck.com/vehiclehistory/?vin=${enc}`,
      free: false,
      descriptionAz:
        "Experian tərəfindən — ABŞ başlıq, zərər, geri çağırma qeydləri"
    });
  }

  // ── Avropa ────────────────────────────────────────────────────────────
  if (region === "europe") {
    links.push({
      name: "AutoDNA",
      nameAz: "AutoDNA",
      url: `https://www.autodna.com/vin/${enc}`,
      free: false,
      descriptionAz:
        "Avropa registri — servis tarixçəsi, geri çağırmalar, qəzalar, Almaniya/Fransa/İtaliya üçün güclüdür"
    });
    links.push({
      name: "Motorway History",
      nameAz: "Motorway (UK)",
      url: `https://motorway.co.uk/car-history-check?vin=${enc}`,
      free: false,
      descriptionAz:
        "Böyük Britaniya qeydiyyat tarixçəsi — MOT, vergi, finansman yoxlaması"
    });
  }

  // ── Yaponiya ──────────────────────────────────────────────────────────
  if (region === "japan") {
    links.push({
      name: "JEVIC",
      nameAz: "JEVIC — Yaponiya İxrac Yoxlaması",
      url: "https://www.jevic.com/",
      free: false,
      descriptionAz:
        "Yaponiya İxrac Avtomobil Yoxlama Mərkəzi — Azərbaycana gətirilmiş yapon avtomobilləri üçün"
    });
    links.push({
      name: "Japan Used Car Auctions",
      nameAz: "USS / JAA Auksion Tarixçəsi",
      url: "https://www.japanesecartrade.com/vin/",
      free: false,
      descriptionAz:
        "Yapon auksion qiymətləndirilməsi, şəkilləri, zərər qeydləri"
    });
  }

  // ── Cənubi Koreya ─────────────────────────────────────────────────────
  if (region === "korea") {
    links.push({
      name: "CarHistory Korea",
      nameAz: "CarHistory — Koreya",
      url: "https://www.carhistory.kr/en/main/intro",
      free: false,
      descriptionAz:
        "Koreya Milli Avtomobil Tarixçəsi İnformasiya Sistemi — rəsmi dövlət qaynağı"
    });
  }

  // ── Çin ──────────────────────────────────────────────────────────────
  if (region === "china") {
    links.push({
      name: "che300.com",
      nameAz: "Che300 (Çin bazarı)",
      url: `https://www.che300.com/`,
      free: false,
      descriptionAz:
        "Çin yerli avtomobil qiymətləndirilmə və tarixçə platforması"
    });
  }

  return {
    vin: vin.toUpperCase(),
    region,
    regionLabelAz: REGION_LABELS[region],
    links
  };
}
