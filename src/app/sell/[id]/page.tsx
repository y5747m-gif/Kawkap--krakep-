import { notFound } from "next/navigation";
import SellWizard from "@/components/SellWizard";
import { getCurrentUser, getGuestToken, canManageListing } from "@/lib/auth";
import { getProductRow, listProductImages, getCategoryById } from "@/lib/models/products";
import { getProfile, isGuestSellerId } from "@/lib/models/users";

export const dynamic = "force-dynamic";

export const metadata = { title: "تعديل الإعلان" };

/**
 * تعديل إعلان — لصاحب الإعلان (بحساب أو كضيف من نفس المتصفح) أو الإدارة.
 * لا يوجد أي إجبار على تسجيل الدخول.
 */
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const guestToken = await getGuestToken();

  const product = getProductRow(id);
  if (!product) notFound();
  if (!canManageListing(product, user, guestToken)) notFound();

  const images = listProductImages(product.id);
  const category = getCategoryById(product.categoryId);
  const isGuestListing = isGuestSellerId(product.sellerId);
  const sellerProfile = isGuestListing ? null : getProfile(product.sellerId);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-planet-950 sm:text-3xl">تعديل الإعلان</h1>
        <p className="mt-1.5 text-sm text-planet-600">{product.title} — كود {product.code}</p>
      </div>
      <SellWizard
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
          user && !isGuestListing
            ? {
                name: user.name,
                phone: user.phone,
                gov: sellerProfile?.gov ?? null,
                avatarUrl: sellerProfile?.avatarUrl ?? null,
              }
            : null
        }
      />
    </div>
  );
}
