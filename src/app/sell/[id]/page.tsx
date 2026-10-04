import { notFound, redirect } from "next/navigation";
import SellWizard from "@/components/SellWizard";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getProductRow, listProductImages, getCategoryById } from "@/lib/models/products";
import { getProfile } from "@/lib/models/users";

export const dynamic = "force-dynamic";

export const metadata = { title: "تعديل الإعلان" };

/** تعديل إعلان — للبائع صاحب الإعلان أو الإدارة */
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sell/${id}`);

  const product = getProductRow(id);
  if (!product) notFound();
  if (product.sellerId !== user.id && !isAdmin(user)) notFound();

  const images = listProductImages(product.id);
  const category = getCategoryById(product.categoryId);
  const sellerProfile = getProfile(product.sellerId);

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
          images: images.map((i) => ({ url: i.url })),
        }}
        seller={{
          name: user.name,
          phone: user.phone,
          gov: sellerProfile?.gov ?? null,
          avatarUrl: sellerProfile?.avatarUrl ?? null,
        }}
      />
    </div>
  );
}
