import { endSession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  endSession();
  return jsonOk({ loggedOut: true });
}
