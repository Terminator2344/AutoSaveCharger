import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import Image from "next/image";

export default async function ExperiencePage({
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

    const displayName = user?.name || (user?.username ? `@${user.username}` : "User");
    const avatar = user?.image_url as string | undefined;
    const accessLevel = access?.has_access ? "Active" : "No access";
    const companyTitle = (experience as any)?.company?.title ?? "";

    return (
        <div
            className="min-h-screen text-[#e5e5e5]"
            style={{
                background: "#050505",
                backgroundImage: `radial-gradient(circle at 50% 0%, rgba(26, 10, 0, 0.8) 0%, #050505 80%),
                  radial-gradient(circle at 20% 50%, rgba(255, 85, 0, 0.08) 0%, transparent 60%),
                  radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.06) 0%, transparent 60%)`,
                backgroundAttachment: "fixed",
            }}
        >
            <div className="max-w-[1400px] mx-auto px-8 pt-6">
                <div className="flex items-center gap-4 mb-4">
                    {avatar ? (
                        <Image src={avatar} alt="avatar" width={40} height={40} className="rounded-full border border-[rgba(255,85,0,0.25)]" />
                    ) : (
                        <div className="w-10 h-10 rounded-full border border-[rgba(255,85,0,0.25)] bg-[rgba(20,10,0,0.4)]" />
                    )}
                    <div className="flex flex-col">
                        <div className="text-sm text-[#a3a3a3]">{accessLevel}</div>
                        <div className="text-base font-semibold">{displayName}</div>
                    </div>
                    <div className="ml-auto text-sm text-[#a3a3a3]">
                        {devMode && <span className="px-2 py-1 rounded-md border border-[rgba(255,85,0,0.25)] bg-[rgba(20,10,0,0.4)]">Dev mode: Whop iframe not detected.</span>}
                    </div>
                </div>
                <div className="mb-2 text-sm text-[#a3a3a3]">
                    {experience.name} {companyTitle ? `— ${companyTitle}` : ""}
                </div>
            </div>

            {/* Placeholder: dashboard UI moved to main app /dashboard */}
            <div className="max-w-[1400px] mx-auto px-8 pb-12">
                <div className="rounded-xl border border-[rgba(255,85,0,0.25)] bg-[rgba(20,10,0,0.4)] backdrop-blur p-6">
                    <div className="text-[#a3a3a3] text-sm mb-2">Analytics</div>
                    <div className="text-lg font-semibold mb-1">AutoCharge Saver Analytics</div>
                    <div className="text-[#a3a3a3] text-sm">Open the dashboard at <span className="text-[#ffd166] font-medium">/dashboard</span> in the main app.</div>
                </div>
            </div>
        </div>
    );
}
