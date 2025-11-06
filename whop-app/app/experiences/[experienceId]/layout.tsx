import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import Layout from "@/app/views/Layout";

export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // Detect dev mode (no Whop iframe/token)
  let devMode = false;
  try {
    await whopsdk.verifyUserToken(await headers());
  } catch {
    devMode = true;
  }

  return <Layout devMode={devMode}>{children}</Layout>;
}

