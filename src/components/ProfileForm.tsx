"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "./Toast";
import { GOVERNORATES } from "@/lib/constants";

/** نموذج بيانات الحساب: الاسم، الصورة، الهاتف، البريد، الموقع */
export function ProfileEditForm({
  initial,
}: {
  initial: {
    name: string; phone: string; email: string | null;
    gov: string | null; area: string | null; bio: string | null; avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone,
    email: initial.email ?? "",
    gov: initial.gov ?? "",
    area: initial.area ?? "",
    bio: initial.bio ?? "",
    avatarUrl: initial.avatarUrl,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, avatarUrl: data.url }));
      toast("تم رفع الصورة — اضغط حفظ لتأكيدها", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "تعذر رفع الصورة", "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          gov: form.gov || null,
          area: form.area || null,
          bio: form.bio || null,
          avatarUrl: form.avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("تم حفظ بياناتك بنجاح", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="glass space-y-5 rounded-3xl p-4 sm:p-6">
      {/* الصورة الشخصية */}
      <div className="flex items-center gap-4">
        {form.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.avatarUrl} alt="صورتك" className="h-20 w-20 rounded-3xl border-2 border-planet-100 object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-planet-500 to-tealx-500 text-2xl font-black text-white">
            {form.name.charAt(0)}
          </span>
        )}
        <div>
          <button type="button" onClick={() => fileInput.current?.click()} className="btn-outline px-4 py-2.5 text-xs">
            {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            تغيير الصورة
          </button>
          <p className="mt-1.5 text-[11px] font-bold text-planet-400">JPG أو PNG — حتى 5 ميجابايت</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAvatar(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">الاسم</label>
          <input className="field" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="field-label">رقم الهاتف</label>
          <input className="field" value={form.phone} onChange={set("phone")} dir="ltr" inputMode="tel" />
        </div>
        <div>
          <label className="field-label">البريد الإلكتروني</label>
          <input type="email" className="field" value={form.email} onChange={set("email")} dir="ltr" />
        </div>
        <div>
          <label className="field-label">المحافظة</label>
          <select className="field" value={form.gov} onChange={set("gov")}>
            <option value="">غير محدد</option>
            {GOVERNORATES.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">المنطقة</label>
          <input className="field" value={form.area} onChange={set("area")} placeholder="مثال: مدينة نصر" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">نبذة عنك (تظهر للمشترين)</label>
          <textarea className="field min-h-20" value={form.bio} onChange={set("bio")} placeholder="مثال: أبيع خردة ومعادن منذ 2015 — الأسعار أفضل سعر في السوق" maxLength={300} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-sell px-6 py-3.5 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        حفظ البيانات
      </button>
    </form>
  );
}

/** تغيير كلمة المرور */
export function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("تم تغيير كلمة المرور بنجاح", "success");
      setCurrent("");
      setNext("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="glass space-y-4 rounded-3xl p-4 sm:p-6">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-planet-900">
        <ShieldCheck size={17} className="text-planet-500" /> تغيير كلمة المرور
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">كلمة المرور الحالية</label>
          <input type="password" className="field" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">كلمة المرور الجديدة</label>
          <input type="password" className="field" value={next} onChange={(e) => setNext(e.target.value)} placeholder="6 أحرف على الأقل" required />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-outline px-5 py-3 text-sm">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
        تحديث كلمة المرور
      </button>
    </form>
  );
}
