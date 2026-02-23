/**
 * Navigates to a specific route within the application.
 * @param {Object} args - Arguments containing the target route.
 * @param {string} args.route - Target absolute path (e.g. /admin/projects).
 * @param {Function} navigate - The navigation function (e.g., from useNavigate).
 * @returns {Promise<Object>} success status and message.
 */
export const action = async ({ route }, navigate) => {
  console.log('Exec: command_center.exec.navigate', route);
  if (route) {
    navigate(route);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, message: `Navigating to ${route}` };
  }
  return { success: false, message: 'Route not provided' };
};
