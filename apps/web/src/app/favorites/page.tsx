import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { getServerSessionUser } from "@/lib/auth";
import { getRelatedListings } from "@/server/listing-store";
import { listUserFavorites } from "@/server/user-store";

export default async function FavoritesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/favorites");

  const favoriteIds = await listUserFavorites(user.id);
  const items = await getRelatedListings(favoriteIds);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Favorilər</h1>
          <p className="mt-2 text-slate-500">{items.length} elan saxlanılıb</p>
        </div>
        <Link href="/listings" className="btn-secondary">Elanlara qayıt</Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-slate-900">Favorilər boşdur</h2>
          <p className="mt-2 text-sm text-slate-500">Bəyəndiyiniz elanları saxlayın ki sonra asan tapa biləsiniz.</p>
          <Link href="/listings" className="btn-primary mt-6">Elanlara bax</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
