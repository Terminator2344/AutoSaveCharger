import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import Layout from "@/app/views/Layout";
import DashboardView from "@/app/views/DashboardView";
import type { Company, User, Access } from "@/app/views/types";

export default async function DashboardPage() {
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
  // В dev mode или без companyId возвращаем null
  const [company, user, access] = userId
    ? await Promise.all([
        // Попытка получить company через user (если есть доступ)
        whopsdk.users.retrieve(userId).then(async (u) => {
          try {
            // Если есть company_id в user, используем его
            const companyId = (u as any)?.company_id;
            return companyId ? await whopsdk.companies.retrieve(companyId) : null;
          } catch {
            return null;
          }
        }),
        whopsdk.users.retrieve(userId),
        // Без companyId access проверка не имеет смысла
        Promise.resolve(null),
      ])
    : [null, null, null];

  // Возвращаем основной макет и дашборд
  return (
    <Layout devMode={devMode}>
      <DashboardView
        company={company as Company | null}
        user={user as User | null}
        access={access as Access | null}
      />
    </Layout>
  );
}














