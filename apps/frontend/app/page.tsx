import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName } from "../src/lib/constants";

export default async function HomePage() {
  const cookieStore = await cookies();

  if (cookieStore.has(sessionCookieName)) {
    redirect("/assignments");
  }

  redirect("/login");
}
