export async function storeUserTokens(userId: string, tokens: any) {
  console.log(`[storeUserTokens] saving tokens for user ${userId}`);
  // TODO: если хочешь сохранять токены в Supabase, можешь заменить это на запрос
  // await supabase.from('user_tokens').upsert({ userId, ...tokens })
}
