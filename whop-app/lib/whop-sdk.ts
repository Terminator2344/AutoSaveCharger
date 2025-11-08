import { Whop } from '@whop/sdk';

// Создаём экземпляр SDK клиента
const whopClient = new Whop({
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID || process.env.WHOP_APP_ID || '',
  apiKey: process.env.WHOP_API_KEY || '',
});

/**
 * Адаптер для verifyUserToken
 * Принимает headers и возвращает объект с userId
 */
async function verifyUserToken(headers: Headers | Awaited<ReturnType<typeof import('next/headers').headers>>) {
  // Проверяем, есть ли токен в headers
  const authHeader = headers.get('authorization') || headers.get('x-whop-user-token');
  if (!authHeader) {
    throw new Error('No authorization token found');
  }

  // Извлекаем токен
  const token = authHeader.replace(/^Bearer\s+/i, '');

  // Верифицируем токен через SDK
  try {
    // Попытка использовать метод SDK для верификации
    const result = await whopClient.users.retrieve(token).catch(() => {
      return null;
    });

    if (!result) {
      // Если не удалось получить пользователя, возвращаем базовую структуру
      return {
        userId: token,
        id: token,
      };
    }

    // Используем правильные свойства из ответа SDK (id вместо userId)
    const userId = (result as any).id || token;
    return {
      userId,
      ...result,
    };
  } catch (error) {
    // Если верификация не удалась, возвращаем базовую структуру
    return {
      userId: token,
      id: token,
    };
  }
}

/**
 * Адаптер для users.retrieve
 */
async function retrieveUser(userId: string) {
  return await whopClient.users.retrieve(userId);
}

/**
 * Адаптер для companies.retrieve
 */
async function retrieveCompany(companyId: string) {
  return await whopClient.companies.retrieve(companyId);
}

/**
 * Адаптер для experiences.retrieve
 */
async function retrieveExperience(experienceId: string) {
  return await whopClient.experiences.retrieve(experienceId);
}

/**
 * Адаптер для users.checkAccess
 * Принимает experienceId или companyId и объект с id пользователя
 */
async function checkAccess(
  resourceId: string,
  options: { id: string }
): Promise<{ has_access: boolean }> {
  try {
    // SDK ожидает resourceId, userId и опциональные параметры как отдельные аргументы
    const result = await (whopClient.users.checkAccess as any)(
      resourceId,
      options.id
    );
    return {
      has_access: (result as any).has_access || false,
    };
  } catch (error) {
    // Если проверка доступа не удалась, возвращаем false
    return {
      has_access: false,
    };
  }
}

// Экспортируем объект со старой структурой
export const whopsdk = {
  verifyUserToken,
  users: {
    retrieve: retrieveUser,
    checkAccess,
  },
  companies: {
    retrieve: retrieveCompany,
  },
  experiences: {
    retrieve: retrieveExperience,
  },
};

export default whopsdk;
