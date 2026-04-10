import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { updateListingForOwner } from "@/server/listing-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş tələb olunur." }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    title?: string;
    description?: string;
    city?: string;
    priceAzn?: number;
    make?: string;
    model?: string;
    year?: number;
    mileageKm?: number;
    fuelType?: string;
    engineType?: string;
    transmission?: string;
    vin?: string;
    bodyType?: string;
    driveType?: string;
    color?: string;
    condition?: string;
    engineVolumeCc?: number;
    interiorMaterial?: string;
    hasSunroof?: boolean;
    creditAvailable?: boolean;
    barterAvailable?: boolean;
    seatHeating?: boolean;
    seatCooling?: boolean;
    camera360?: boolean;
    parkingSensors?: boolean;
    adaptiveCruise?: boolean;
    laneAssist?: boolean;
    ownersCount?: number;
    hasServiceBook?: boolean;
    hasRepairHistory?: boolean;
  };

  const result = await updateListingForOwner(id, user.id, {
    title: typeof payload.title === "string" ? payload.title : undefined,
    description: typeof payload.description === "string" ? payload.description : undefined,
    city: typeof payload.city === "string" ? payload.city : undefined,
    priceAzn: typeof payload.priceAzn === "number" ? payload.priceAzn : undefined,
    make: typeof payload.make === "string" ? payload.make : undefined,
    model: typeof payload.model === "string" ? payload.model : undefined,
    year: typeof payload.year === "number" ? payload.year : undefined,
    mileageKm: typeof payload.mileageKm === "number" ? payload.mileageKm : undefined,
    fuelType: typeof payload.fuelType === "string" ? payload.fuelType : undefined,
    engineType: typeof payload.engineType === "string" ? payload.engineType : undefined,
    transmission: typeof payload.transmission === "string" ? payload.transmission : undefined,
    vin: typeof payload.vin === "string" ? payload.vin : undefined,
    bodyType: typeof payload.bodyType === "string" ? payload.bodyType : undefined,
    driveType: typeof payload.driveType === "string" ? payload.driveType : undefined,
    color: typeof payload.color === "string" ? payload.color : undefined,
    condition: typeof payload.condition === "string" ? payload.condition : undefined,
    engineVolumeCc: typeof payload.engineVolumeCc === "number" ? payload.engineVolumeCc : undefined,
    interiorMaterial: typeof payload.interiorMaterial === "string" ? payload.interiorMaterial : undefined,
    hasSunroof: typeof payload.hasSunroof === "boolean" ? payload.hasSunroof : undefined,
    creditAvailable: typeof payload.creditAvailable === "boolean" ? payload.creditAvailable : undefined,
    barterAvailable: typeof payload.barterAvailable === "boolean" ? payload.barterAvailable : undefined,
    seatHeating: typeof payload.seatHeating === "boolean" ? payload.seatHeating : undefined,
    seatCooling: typeof payload.seatCooling === "boolean" ? payload.seatCooling : undefined,
    camera360: typeof payload.camera360 === "boolean" ? payload.camera360 : undefined,
    parkingSensors: typeof payload.parkingSensors === "boolean" ? payload.parkingSensors : undefined,
    adaptiveCruise: typeof payload.adaptiveCruise === "boolean" ? payload.adaptiveCruise : undefined,
    laneAssist: typeof payload.laneAssist === "boolean" ? payload.laneAssist : undefined,
    ownersCount: typeof payload.ownersCount === "number" ? payload.ownersCount : undefined,
    hasServiceBook: typeof payload.hasServiceBook === "boolean" ? payload.hasServiceBook : undefined,
    hasRepairHistory: typeof payload.hasRepairHistory === "boolean" ? payload.hasRepairHistory : undefined
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Yenilənmə uğursuz oldu." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
