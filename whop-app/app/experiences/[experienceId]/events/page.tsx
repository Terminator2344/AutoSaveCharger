import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import EventsView from "@/app/views/EventsView";

export default async function ExperienceEventsPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // Detect dev mode (no Whop iframe/token)
  let userId: string | null = null;
  let devMode = false;
  try {
    const v = await whopsdk.verifyUserToken(await headers());
    userId = v.userId;
  } catch {
    devMode = true;
  }

  // Fetch Whop data when available
  const experience = await whopsdk.experiences.retrieve(experienceId);
  const user = userId ? await whopsdk.users.retrieve(userId) : null as any;
  const access = userId
    ? await whopsdk.users.checkAccess(experienceId, { id: userId })
    : ({ has_access: true } as any);

  if (access?.has_access === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#e5e5e5]">
        <div className="rounded-xl border border-[rgba(255,85,0,0.25)] bg-[rgba(20,10,0,0.4)] backdrop-blur p-6">
          No access — please renew your subscription.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-2 pb-8">
      <EventsView />
    </div>
  );
}

