import { redirect } from "next/navigation";

export default async function AdminBusinessProfilesRedirectPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const targetBase =
    params.profileType === "store" ? "/admin/magaza-profiles" : "/admin/salon-profiles";

  const q = new URLSearchParams();
  if (typeof params.q === "string") q.set("q", params.q);
  if (typeof params.verified === "string") q.set("verified", params.verified);
  if (typeof params.page === "string") q.set("page", params.page);
  if (typeof params.pageSize === "string") q.set("pageSize", params.pageSize);

  const query = q.toString();
  redirect(query ? `${targetBase}?${query}` : targetBase);
}
