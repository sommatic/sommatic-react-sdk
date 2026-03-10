/**
 * Open a Sommatic App in runtime view.
 * @param {Object} args - Arguments containing the app slug.
 * @param {string} args.slug - The app slug to open (e.g. "sommatic-approval-desk").
 * @param {Function} navigate - The navigation function (e.g., from useNavigate).
 * @returns {Promise<Object>} success status and message.
 */
export const action = async ({ slug }, navigate) => {
  if (!slug) {
    return { success: false, message: 'App slug not provided' };
  }

  const currentPath = window.location.pathname;
  const prefix = currentPath.startsWith('/admin') ? '/admin' : '/client';
  const targetRoute = `${prefix}/application-management/runtime/${slug}`;

  navigate(targetRoute);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return { success: true, message: `Opening app: ${slug}` };
};
