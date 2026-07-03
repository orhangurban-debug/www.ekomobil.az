/**
 * EkoMobil — test məlumatları seed skripti
 *
 * Real istifadəçi axını simulyasiya edir: istifadəçilər birbaşa DB-də yaradılır
 * (qeydiyyat/OTP axınını keçmək üçün — sürət və rate-limit səbəbindən), sonra hər
 * istifadəçi üçün real sessiya cookie-si (`createSessionToken` ilə eyni HMAC formatı)
 * "mint" edilir və BÜTÜN elan/servis/auksion yaratma əməliyyatları HƏQİQİ HTTP API-lar
 * (POST /api/listings, /api/support/requests, /api/auctions, /api/admin/service-listings)
 * üzərindən aparılır — beləliklə validasiya, trust score, plan limitləri kimi real biznes
 * qaydaları da sınaqdan keçir.
 *
 * İSTİFADƏ:
 *   cd apps/web
 *   SEED_BASE_URL=http://localhost:3002 node --env-file=.env scripts/seed-test-data.mjs
 *
 * Qeyd: Bu skript idempotent DEYİL — hər işə salındıqda yeni elanlar əlavə edir.
 * Yalnız local/dev mühitdə istifadə üçündür.
 */

import pg from "pg";
import { randomUUID, createHmac, scryptSync } from "node:crypto";

const BASE_URL = process.env.SEED_BASE_URL || "http://localhost:3002";
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-me";
const SESSION_COOKIE_NAME = "ekomobil_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SEED_PASSWORD = "SeedTest123!";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL tapılmadı. `node --env-file=.env scripts/seed-test-data.mjs` ilə işə salın.");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

// ─── Auth helpers (createSessionToken ilə eyni HMAC formatı) ───────────────

function hashPassword(password) {
  const salt = randomUUID();
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function toBase64Url(input) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(raw) {
  return createHmac("sha256", AUTH_SECRET).update(raw).digest("hex");
}

function createSessionToken(user) {
  const payload = { user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function cookieFor(user) {
  return `${SESSION_COOKIE_NAME}=${createSessionToken({ id: user.id, email: user.email, role: user.role })}`;
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

const stats = { ok: 0, failed: 0 };
const failures = [];

async function apiPost(pathName, body, cookie) {
  const res = await fetch(`${BASE_URL}${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body)
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // ignore
  }
  if (res.ok && json?.ok !== false) {
    stats.ok += 1;
  } else {
    stats.failed += 1;
    failures.push({ path: pathName, status: res.status, body: json, sent: body });
  }
  return { status: res.status, json };
}

// ─── DB helpers ─────────────────────────────────────────────────────────────

async function upsertUser({ email, fullName, city, phone, role }) {
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, email_verified, phone, phone_verified)
     VALUES ($1, $2, $3, $4, true, $5, true)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
    [randomUUID(), email, hashPassword(SEED_PASSWORD), role, phone]
  );
  const { rows } = await db.query(`SELECT id, email, role FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  await db.query(
    `INSERT INTO user_profiles (user_id, full_name, city)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, city = EXCLUDED.city`,
    [user.id, fullName, city]
  );
  return { ...user, cookie: cookieFor(user) };
}

async function upsertDealerProfile({ ownerUserId, name, city, verified = true }) {
  const existing = await db.query(`SELECT id FROM dealer_profiles WHERE owner_user_id = $1`, [ownerUserId]);
  if (existing.rows[0]) return existing.rows[0].id;
  const id = randomUUID();
  await db.query(
    `INSERT INTO dealer_profiles (id, owner_user_id, name, city, verified)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, ownerUserId, name, city, verified]
  );
  return id;
}

async function upsertBusinessSubscription({ ownerUserId, businessType, planId }) {
  const existing = await db.query(
    `SELECT id FROM business_plan_subscriptions WHERE owner_user_id = $1 AND business_type = $2`,
    [ownerUserId, businessType]
  );
  if (existing.rows[0]) {
    await db.query(
      `UPDATE business_plan_subscriptions SET plan_id = $2, status = 'active', starts_at = NOW() - interval '1 day', expires_at = NOW() + interval '365 days' WHERE id = $1`,
      [existing.rows[0].id, planId]
    );
    return;
  }
  await db.query(
    `INSERT INTO business_plan_subscriptions (id, owner_user_id, business_type, plan_id, status, starts_at, expires_at)
     VALUES ($1, $2, $3, $4, 'active', NOW() - interval '1 day', NOW() + interval '365 days')`,
    [randomUUID(), ownerUserId, businessType, planId]
  );
}

async function activateListings(ids) {
  if (ids.length === 0) return;
  await db.query(
    `UPDATE listings SET status = 'active', updated_at = NOW() WHERE id = ANY($1::text[]) AND status = 'pending_review'`,
    [ids]
  );
}

// ─── Seed data catalogs ─────────────────────────────────────────────────────

const CITIES = ["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Naxçıvan", "Şəki", "Mingəçevir", "Quba"];

// Elan şəkilləri üçün TƏHLÜKƏSİZ placeholder: `data:image/...;base64,...`.
// DİQQƏT: `sanitizeMediaUrl` (server/listing-store.ts) artıq ixtiyari xarici `https://` şəkil
// URL-lərinə icazə vermir — belə URL-lər `next/image` render zamanı "host konfiqurasiya
// edilməyib" xətası ilə BÜTÜN səhifəni (`/listings`, `/parts` və s.) çökdürə bilirdi
// (konfiqurasiya edilməmiş host + bütün ziyarətçilər üçün DoS). Ona görə seed skripti də
// yalnız server-in qəbul etdiyi eyni-mənşəli/base64 formatlardan istifadə etməlidir.
const PLACEHOLDER_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function img() {
  return `data:image/png;base64,${PLACEHOLDER_PNG_BASE64}`;
}

function vehicleImages() {
  return Array.from({ length: 8 }, () => img());
}

function fullMediaProtocol(imageUrls) {
  return {
    imageCount: imageUrls.length,
    engineVideoDurationSec: 0,
    hasFrontAngle: true,
    hasRearAngle: true,
    hasLeftSide: true,
    hasRightSide: true,
    hasDashboard: true,
    hasInterior: true,
    hasOdometer: true,
    hasTrunk: true
  };
}

function randomVin(seed) {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"; // I/O/Q istisna
  let out = "";
  let s = seed;
  for (let i = 0; i < 17; i++) {
    s = (s * 9301 + 49297) % 233280;
    out += chars[Math.floor((s / 233280) * chars.length)];
  }
  return out;
}

const VEHICLE_SPECS = [
  { make: "Toyota", model: "Camry", body: "Sedan", fuel: "Benzin", engine: "Atmosfer", trans: "Avtomat", color: "Ağ", cond: "Qəzasız", year: 2021, price: 34000 },
  { make: "Hyundai", model: "Tucson", body: "SUV", fuel: "Dizel", engine: "Turbo", trans: "Avtomat", color: "Qara", cond: "Qəzasız", year: 2020, price: 38500 },
  { make: "Toyota", model: "Prius", body: "Hatchback", fuel: "Hibrid", engine: "Hibrid sistem", trans: "Variator (CVT)", color: "Gümüşü", cond: "Qəzasız", year: 2019, price: 24500 },
  { make: "Tesla", model: "Model 3", body: "Sedan", fuel: "Elektrik", engine: "Elektrik motoru", trans: "Avtomat", color: "Qırmızı", cond: "Qəzasız", year: 2022, price: 52000 },
  { make: "Ford", model: "Ranger", body: "Pickup", fuel: "Dizel", engine: "Turbo", trans: "Mexanik", color: "Boz", cond: "Rənglənmiş", year: 2018, price: 29500 },
  { make: "BMW", model: "4 Series", body: "Coupe", fuel: "Benzin", engine: "Turbo", trans: "Robotlaşdırılmış", color: "Mavi", cond: "Qəzasız", year: 2021, price: 61000 },
  { make: "Kia", model: "Carnival", body: "Minivan", fuel: "Benzin", engine: "Atmosfer", trans: "Avtomat", color: "Bəyaz", cond: "Qəzasız", year: 2020, price: 33000 },
  { make: "Mercedes-Benz", model: "SLK", body: "Cabrio", fuel: "Benzin", engine: "Kompressor", trans: "Avtomat", color: "Sarı", cond: "Qəzalı", year: 2015, price: 27000 },
  { make: "Volkswagen", model: "Transporter", body: "Van", fuel: "Dizel", engine: "Turbo", trans: "Mexanik", color: "Ağ", cond: "Qəzasız", year: 2017, price: 26500 },
  { make: "Skoda", model: "Octavia", body: "Universal", fuel: "Qaz (LPG)", engine: "Atmosfer", trans: "Mexanik", color: "Yaşıl", cond: "Qəzasız", year: 2016, price: 15500 },
  { make: "Honda", model: "Clarity", body: "Sedan", fuel: "Hidrogen (FCEV)", engine: "Hidrogen yanacaq hüceyrəsi", trans: "Avtomat", color: "Gümüşü", cond: "Qəzasız", year: 2019, price: 41000 },
  { make: "Mitsubishi", model: "Outlander", body: "Crossover", fuel: "Plug-in Hibrid", engine: "Hibrid sistem", trans: "Variator (CVT)", color: "Qara", cond: "Qəzasız", year: 2021, price: 36500 },
  { make: "Chevrolet", model: "Camaro", body: "Coupe", fuel: "Benzin", engine: "Atmosfer", trans: "Mexanik", color: "Narıncı", cond: "Qəzasız", year: 2020, price: 47000 },
  { make: "Nissan", model: "Leaf", body: "Hatchback", fuel: "Elektrik", engine: "Elektrik motoru", trans: "Avtomat", color: "Mavi", cond: "Qəzasız", year: 2020, price: 22000 },
  { make: "Lada", model: "Niva", body: "SUV", fuel: "Qaz (CNG)", engine: "Atmosfer", trans: "Mexanik", color: "Bej", cond: "Qəzasız", year: 2014, price: 9800 }
];

const PART_SPECS = [
  { category: "Mühərrik və aqreqatlar", sub: "Turbo", name: "Turbokompressor", brand: "Bosch" },
  { category: "Asqı və sükan", sub: "Amortizator", name: "Ön amortizator dəsti", brand: "KYB" },
  { category: "Əyləc sistemi", sub: "Əyləc diski", name: "Ön əyləc diski", brand: "Brembo" },
  { category: "Elektrik və elektronika", sub: "Generator", name: "Generator 90A", brand: "Denso" },
  { category: "İşıqlandırma", sub: "Faralar", name: "LED far dəsti", brand: "Hella" },
  { category: "Filtrlər və yağlar", sub: "Mühərrik yağı", name: "Sintetik mühərrik yağı 5W-30", brand: "Mobil" },
  { category: "Təkər və disklər", sub: "Yay təkəri", name: "Yay təkəri 225/45 R18", brand: "Michelin" },
  { category: "Kuzov hissələri", sub: "Bamper", name: "Ön bamper", brand: "Digər" },
  { category: "Salon və aksesuar", sub: "Multimedia", name: "Android multimedia sistemi", brand: "Digər" },
  { category: "Akkumulyator və enerji", sub: "Akkumulyator", name: "60Ah akkumulyator", brand: "Varta" },
  { category: "Soyutma və kondisioner", sub: "Radiator", name: "Mühərrik radiatoru", brand: "Valeo" },
  { category: "Transmissiya və debriyaj", sub: "Debriyaj komplekti", name: "Debriyaj dəsti", brand: "Sachs" },
  { category: "Səsboğucu və egzoz", sub: "Katalizator", name: "Katalizator", brand: "Digər" },
  { category: "Təhlükəsizlik sistemləri", sub: "Airbag", name: "Sükan airbag modulu", brand: "Digər" },
  { category: "Detailing və kimyəvi məhsullar", sub: "Polish", name: "Boya polish dəsti", brand: "Liqui Moly" },
  { category: "Alətlər və servis avadanlığı", sub: "Diaqnostika cihazı", name: "OBD2 diaqnostika cihazı", brand: "Digər" },
  { category: "12V/220V avto elektronika", sub: "DVR", name: "Full HD avto DVR", brand: "Digər" },
  { category: "Motosiklet və ATV hissələri", sub: "Zəncir dəsti", name: "Motosiklet zəncir dəsti", brand: "Digər" },
  { category: "Universal məhsullar", sub: "Universal aksesuar", name: "Universal ayaq açarı", brand: "Digər" }
];

const SERVICE_PROVIDER_TYPES = [
  "official_service", "inspection_company", "mechanic", "auto_electrician", "body_shop",
  "painting", "ev_hybrid", "ecu_programmer", "adas_specialist", "ac_specialist",
  "audio_media", "glass_sunroof", "tire_wheel"
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  await db.connect();

  console.log(`\n== EkoMobil test data seed == (BASE_URL=${BASE_URL})\n`);

  // Health check
  const health = await fetch(`${BASE_URL}/`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`Dev server ${BASE_URL} ünvanında cavab vermir. Əvvəlcə \`npm run dev\` işə salın.`);
    process.exit(1);
  }
  console.log("✓ Dev server cavab verir.\n");

  const activeVehicleIds = [];
  const activePartIds = [];

  // ── 1. Admin user (for service listing approvals) ──
  console.log("→ Admin istifadəçi yaradılır...");
  const admin = await upsertUser({
    email: "seed.admin@ekomobil.test",
    fullName: "Seed Admin",
    city: "Bakı",
    phone: "+994500000001",
    role: "admin"
  });

  // ── 2. Private sellers — 1 vehicle + 1 part listing each ──
  console.log(`→ ${VEHICLE_SPECS.length} fərdi satıcı yaradılır (hər biri 1 avtomobil + 1 hissə elanı)...`);
  const privateUsers = [];
  for (let i = 0; i < VEHICLE_SPECS.length; i++) {
    const user = await upsertUser({
      email: `seed.private${i + 1}@ekomobil.test`,
      fullName: `Test Satıcı ${i + 1}`,
      city: CITIES[i % CITIES.length],
      phone: `+99450${String(1000000 + i).slice(-7)}`,
      role: "viewer"
    });
    privateUsers.push(user);
  }

  for (let i = 0; i < VEHICLE_SPECS.length; i++) {
    const spec = VEHICLE_SPECS[i];
    const user = privateUsers[i];
    const images = vehicleImages();
    const { json } = await apiPost(
      "/api/listings",
      {
        title: `${spec.year} ${spec.make} ${spec.model}`,
        description: `${spec.make} ${spec.model} (${spec.year}) — ${spec.cond.toLowerCase()} vəziyyətdə, ${spec.city ?? CITIES[i % CITIES.length]} şəhərindən. Test elanıdır.`,
        priceAzn: spec.price,
        city: CITIES[i % CITIES.length],
        fuelType: spec.fuel,
        engineType: spec.engine,
        transmission: spec.trans,
        bodyType: spec.body,
        driveType: "Ön təkər",
        color: spec.color,
        condition: spec.cond,
        sellerType: "private",
        planType: "free",
        vehicle: { vin: randomVin(1000 + i), make: spec.make, model: spec.model, year: spec.year, declaredMileageKm: 30000 + i * 4500 },
        vinVerified: false,
        sellerVerified: false,
        imageUrls: images,
        mediaProtocol: fullMediaProtocol(images)
      },
      user.cookie
    );
    if (json?.ok) activeVehicleIds.push(json.id);
  }

  for (let i = 0; i < PART_SPECS.length; i++) {
    const spec = PART_SPECS[i];
    const user = privateUsers[i % privateUsers.length];
    const images = Array.from({ length: 4 }, () => img());
    const { json } = await apiPost(
      "/api/listings",
      {
        listingKind: "part",
        title: `${spec.name} (${spec.brand})`,
        description: `${spec.name} — ${spec.category.toLowerCase()} kateqoriyasından, ${spec.brand} istehsalı. Test elanıdır.`,
        priceAzn: 50 + i * 15,
        city: CITIES[i % CITIES.length],
        partCategory: spec.category,
        partSubcategory: spec.sub,
        partName: spec.name,
        partBrand: spec.brand,
        partCondition: i % 3 === 0 ? "new" : i % 3 === 1 ? "used" : "refurbished",
        partAuthenticity: i % 2 === 0 ? "original" : "aftermarket",
        partOemCode: `SEED-OEM-${1000 + i}`,
        partQuantity: 1 + (i % 10),
        sellerType: "private",
        planType: "free",
        sellerVerified: false,
        imageUrls: images,
        mediaProtocol: { imageCount: images.length, engineVideoDurationSec: 0, hasFrontAngle: false, hasRearAngle: false, hasLeftSide: false, hasRightSide: false, hasDashboard: false, hasInterior: false, hasOdometer: false, hasTrunk: false }
      },
      user.cookie
    );
    if (json?.ok) activePartIds.push(json.id);
  }

  // ── 3. Dealer (salon) — vehicle inventory via CSV import (active dərhal) ──
  console.log("→ Dealer (salon) istifadəçi + CSV inventar idxalı...");
  const dealerUser = await upsertUser({
    email: "seed.dealer@ekomobil.test",
    fullName: "Bakı Auto Salon",
    city: "Bakı",
    phone: "+994500000002",
    role: "dealer"
  });
  await upsertDealerProfile({ ownerUserId: dealerUser.id, name: "Bakı Premium Auto Salon", city: "Bakı", verified: true });
  await upsertBusinessSubscription({ ownerUserId: dealerUser.id, businessType: "dealer", planId: "peşəkar" });

  const dealerCsvRows = VEHICLE_SPECS.slice(0, 10).map((spec, i) => {
    const vin = randomVin(5000 + i);
    return [
      `${spec.year} ${spec.make} ${spec.model} (Salon)`, // title
      "", // description
      spec.make,
      spec.model,
      spec.year,
      CITIES[i % CITIES.length],
      spec.price + 1500,
      15000 + i * 3000,
      spec.fuel,
      spec.trans,
      vin
    ].join(",");
  });
  const csvHeader = "title,description,make,model,year,city,priceAzn,mileageKm,fuelType,transmission,vin";
  const csvBody = [csvHeader, ...dealerCsvRows].join("\n");
  const csvRes = await apiPost("/api/dealer/import", { csv: csvBody }, dealerUser.cookie);
  console.log(`  CSV idxalı: ${csvRes.json?.created ?? 0} elan yaradıldı${csvRes.json?.errors?.length ? `, xətalar: ${csvRes.json.errors.join(" | ")}` : ""}`);

  // ── 4. Parts store — part listings via API (sellerType: dealer) ──
  console.log("→ Ehtiyat hissə mağazası istifadəçi + hissə elanları...");
  const partsStoreUser = await upsertUser({
    email: "seed.partsstore@ekomobil.test",
    fullName: "EkoParts Mağazası",
    city: "Bakı",
    phone: "+994500000003",
    role: "dealer"
  });
  await upsertBusinessSubscription({ ownerUserId: partsStoreUser.id, businessType: "parts_store", planId: "baza" });

  for (let i = 0; i < PART_SPECS.length; i++) {
    const spec = PART_SPECS[i];
    const images = Array.from({ length: 4 }, () => img());
    const { json } = await apiPost(
      "/api/listings",
      {
        listingKind: "part",
        title: `[Mağaza] ${spec.name} — ${spec.brand}`,
        description: `${spec.name} — mağaza stokundan, ${spec.brand} keyfiyyət təminatı ilə. Test elanıdır.`,
        priceAzn: 80 + i * 20,
        city: "Bakı",
        partCategory: spec.category,
        partSubcategory: spec.sub,
        partName: spec.name,
        partBrand: spec.brand,
        partCondition: "new",
        partAuthenticity: "original",
        partOemCode: `SEED-STORE-OEM-${2000 + i}`,
        partQuantity: 5 + i,
        sellerType: "dealer",
        // Qeyd: dealer hissə satıcıları üçün server plan_type-ı hər halda "free"-ə
        // məcburlaşdırır (bax: isDealerPartSeller məntiqi) — bu sahə yalnız paylaşılan
        // "listing-create" rate-limit pəncərəsini (6→20 sorğu/24saat) genişləndirmək üçündür.
        planType: "standard",
        sellerVerified: true,
        imageUrls: images,
        mediaProtocol: { imageCount: images.length, engineVideoDurationSec: 0, hasFrontAngle: false, hasRearAngle: false, hasLeftSide: false, hasRightSide: false, hasDashboard: false, hasInterior: false, hasOdometer: false, hasTrunk: false }
      },
      partsStoreUser.cookie
    );
    if (json?.ok) activePartIds.push(json.id);
  }

  // ── 5. Service listings — hər provider type üçün support request + admin approval ──
  console.log(`→ ${SERVICE_PROVIDER_TYPES.length} servis elanı (support request → admin təsdiqi)...`);
  for (let i = 0; i < SERVICE_PROVIDER_TYPES.length; i++) {
    const providerType = SERVICE_PROVIDER_TYPES[i];
    const city = CITIES[i % CITIES.length];
    const { json: reqJson } = await apiPost("/api/support/requests", {
      requestType: "inspection_partner",
      subject: `Servis tərəfdaşlığı: ${providerType}`,
      message: `Test servis müraciəti — ${providerType}.\nŞəhər: ${city}`,
      name: `Test Servis ${i + 1}`,
      email: `seed.service${i + 1}@ekomobil.test`,
      phone: `+99450${String(2000000 + i).slice(-7)}`,
      servicePartner: {
        providerType,
        name: `Test ${providerType.replace(/_/g, " ")} #${i + 1}`,
        city,
        about: `${providerType.replace(/_/g, " ")} sahəsində peşəkar xidmət. Test elanıdır.`,
        services: ["Diaqnostika", "Təmir", "Baxış"],
        phone: `+99450${String(2000000 + i).slice(-7)}`,
        whatsapp: `+99450${String(2000000 + i).slice(-7)}`
      }
    });
    const supportRequestId = reqJson?.id;
    if (!supportRequestId) continue;

    // Pending service listing tapıb approve edirik
    const { rows } = await db.query(
      `SELECT id FROM service_listings WHERE support_request_id = $1 LIMIT 1`,
      [supportRequestId]
    );
    const serviceListingId = rows[0]?.id;
    if (serviceListingId) {
      await apiPost("/api/admin/service-listings", { id: serviceListingId, status: "approved" }, admin.cookie);
    }
  }

  // ── 6. Bulk activate pending free listings (public browse yalnız 'active' göstərir) ──
  console.log("→ Gözləyən (pending_review) elanlar aktivləşdirilir...");
  await activateListings([...activeVehicleIds, ...activePartIds]);

  // ── 7. Auction lots — 2 aktiv fərdi elan üzərindən ──
  console.log("→ Test auksion lotları yaradılır...");
  for (let i = 0; i < Math.min(2, activeVehicleIds.length); i++) {
    const listingId = activeVehicleIds[i];
    const user = privateUsers[i];
    await apiPost(
      "/api/auctions",
      {
        listingId,
        startingBidAzn: VEHICLE_SPECS[i].price - 2000,
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        sellerTermsAccepted: true
      },
      user.cookie
    );
  }

  // ── Summary ──
  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM listings WHERE listing_kind = 'vehicle' AND status = 'active') AS active_vehicles,
      (SELECT COUNT(*) FROM listings WHERE listing_kind = 'part' AND status = 'active') AS active_parts,
      (SELECT COUNT(*) FROM service_listings WHERE status = 'approved') AS approved_services,
      (SELECT COUNT(*) FROM dealer_profiles) AS dealer_profiles,
      (SELECT COUNT(*) FROM auction_listings) AS auctions
  `).catch(() => ({ rows: [{}] }));

  console.log("\n== Nəticə ==");
  console.log(`HTTP sorğuları: ${stats.ok} uğurlu, ${stats.failed} uğursuz`);
  if (failures.length > 0) {
    console.log("\nUğursuz sorğular:");
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.path} → HTTP ${f.status}: ${JSON.stringify(f.json)}`);
    }
    if (failures.length > 20) console.log(`  ... və daha ${failures.length - 20}`);
  }
  console.log("\nDB vəziyyəti:", counts.rows[0]);
  console.log(`\nGiriş məlumatları (bütün seed istifadəçiləri): şifrə = "${SEED_PASSWORD}"`);
  console.log(`  Admin:        seed.admin@ekomobil.test`);
  console.log(`  Dealer:       seed.dealer@ekomobil.test`);
  console.log(`  Parts store:  seed.partsstore@ekomobil.test`);
  console.log(`  Fərdi (1-15): seed.private1@ekomobil.test ... seed.private${VEHICLE_SPECS.length}@ekomobil.test`);
  console.log("\nSəhifələr: /listings  /parts  /services  /dealers  /auction\n");

  await db.end();
}

main().catch(async (err) => {
  console.error("Seed skripti xəta ilə dayandı:", err);
  await db.end().catch(() => undefined);
  process.exit(1);
});
