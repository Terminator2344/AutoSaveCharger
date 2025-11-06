import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import Layout from "@/app/views/Layout";
import EventsView from "@/app/views/EventsView";
import type { Company, User, Access } from "@/app/views/types";

export default async function EventsPage() {
  // Проверяем наличие токена пользователя из Whop
  let userId: string | null = null;
  let devMode = false;
  try {
    const v = await whopsdk.verifyUserToken(await headers());
    userId = v.userId;
  } catch {
    devMode = true;
    console.warn("⚠️ Dev mode: Whop iframe not detected.");
  }

  // Если пользователь авторизован — пытаемся получить данные
  const [company, user, access] = userId
    ? await Promise.all([
        whopsdk.users.retrieve(userId).then(async (u) => {
          try {
            const companyId = (u as any)?.company_id;
            return companyId ? await whopsdk.companies.retrieve(companyId) : null;
          } catch {
            return null;
          }
        }),
        whopsdk.users.retrieve(userId),
        Promise.resolve(null),
      ])
    : [null, null, null];

  // Возвращаем основной макет и events view
  return (
    <Layout devMode={devMode}>
      <EventsView
        company={company as Company | null}
        user={user as User | null}
        access={access as Access | null}
      />
    </Layout>
  );
}










