export default defineNuxtRouteMiddleware((to) => {
    if (to.path.startsWith('/dashboard/composables')) {
        return navigateTo("/dashboard");
    }
});
