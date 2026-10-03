import AdminReportsList from "@/components/admin/ReportsList";
import { listReports } from "@/lib/models/misc";

export const dynamic = "force-dynamic";

export const metadata = { title: "البلاغات" };

export default async function AdminReportsPage() {
  const reports = listReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-planet-950 sm:text-2xl">البلاغات</h1>
        <p className="mt-1 text-sm text-planet-600">بلاغات المستخدمين عن الإعلانات المخالفة</p>
      </div>
      <AdminReportsList initialReports={reports} />
    </div>
  );
}
