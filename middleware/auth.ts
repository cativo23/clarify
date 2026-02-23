export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const supabase = useSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not authenticated, redirect to login
  if (!session?.user) {
    return navigateTo("/login");
  }
});
