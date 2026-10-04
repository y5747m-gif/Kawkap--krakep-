import { endSession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  await endSession();
  return jsonOk({ loggedOut: true });
}
