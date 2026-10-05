import { notFound, redirect } from "next/navigation";
import SellWizard from "@/components/SellWizard";
import { getCurrentUser, getGuestToken, isListingOwner, isAdmin } from "@/lib/auth";
import { getProductRow, listProductImages, getCategoryById } from "@/lib/models/products";
import { getProfile, getUserById, isGuestSellerId } from "@/lib/models/users";
import { getCustomListingFields } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "تعديل الإعلان" };

/**
 * تعديل الإعلان أصبح للإدارة فقط. صاحب طلب البيع يُعاد إلى سجل مبيعاته
 * للعرض والمتابعة دون السماح له بتغيير البيانات التي استلمتها الإدارة.
 */
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const guestToken = await getGuestToken();

  const product = getProductRow(id);
  if (!product) notFound();

  if (!isAdmin(user)) {
    if (isListingOwner(product, user, guestToken)) {
      redirect(`/sales?item=${encodeURIComponent(product.id)}#sale-${product.id}`);
    }
    notFound();
  }

  const images = listProductImages(product.id);
  const category = getCategoryById(product.categoryId);
  const isGuestListing = isGuestSellerId(product.sellerId);
  const sellerProfile = isGuestListing ? null : getProfile(product.sellerId);
  const sellerUser = isGuestListing ? null : getUserById(product.sellerId);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-planet-950 sm:text-3xl">تعديل الإعلان — الإدارة</h1>
        <p className="mt-1.5 text-sm text-planet-600">{product.title} — كود {product.code}</p>
      </div>
      <SellWizard
        ownerFields={getCustomListingFields()}
        initial={{
          productId: product.id,
          title: product.title,
          categorySlug: category?.slug ?? "",
          description: product.description,
          price: product.price,
          pricingType: product.pricingType,
          quantity: product.quantity,
          unit: product.unit,
          condition: product.condition,
          gov: product.gov,
          area: product.area,
          latitude: product.latitude,
          longitude: product.longitude,
          hasDelivery: product.hasDelivery,
          negotiable: product.negotiable,
          contactPhone: product.contactPhone,
          notes: product.notes,
          sellerName: product.guestName,
          weight: product.weight,
          weightUnit: product.weightUnit,
          itemType: product.itemType,
          brand: product.brand,
          model: product.model,
          material: product.material,
          color: product.color,
          year: product.year,
          dimensions: product.dimensions,
          specs: product.specs,
          images: images.map((i) => ({ url: i.url })),
        }}
        seller={
          !isGuestListing
            ? {
                name: sellerUser?.name ?? "البائع",
                phone: product.contactPhone || sellerUser?.phone || "",
                gov: sellerProfile?.gov ?? null,
                avatarUrl: sellerProfile?.avatarUrl ?? null,
              }
            : null
        }
      />
    </div>
  );
}
