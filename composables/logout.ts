export const logout = () => {
  // Clear session storage
  sessionStorage.removeItem('CUUID');
  sessionStorage.removeItem('jwt');
  sessionStorage.removeItem('paseto');
  // Redirect to login page
  navigateTo({path:'/login',replace:true});
};