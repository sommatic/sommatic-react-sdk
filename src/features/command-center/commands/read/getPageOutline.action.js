/**
 * Retrieves the page outline context.
 * @param {Object} context - The page context retrieved from `getContext('page-context')`.
 * @returns {Object} The context object representing the page outline.
 */
export const action = (context) => {
  console.log('Exec: command_center.read.page.outline', context);
  return context;
};
