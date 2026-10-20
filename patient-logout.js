/* Authenticated pages — consistent, accessible log out */
(() => {
  async function logOut(button) {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Logging out…';
    try {
      const { error } = await myBarkChartSupabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      localStorage.removeItem('myBarkChartActivePetId');
      window.location.replace('index.html');
    } catch (error) {
      console.error('MyBarkChart sign-out failed', error);
      button.disabled = false;
      button.textContent = 'Log Out';
      alert('Could not log out. Please try again.');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mbc-logout]').forEach(button => {
      button.addEventListener('click', () => logOut(button));
    });
  });
  // Recheck authenticated pages restored by the browser's back/forward cache.
  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return;
    try {
      const { data: { user }, error } = await myBarkChartSupabase.auth.getUser();
      if (error || !user) window.location.replace('login.html');
    } catch { window.location.replace('login.html'); }
  });
})();
