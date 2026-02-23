/**
 * Retrieves the current scope context.
 * @param {Object} context - The page context retrieved from `getContext('page-context')`.
 * @returns {Object} The context object.
 */
export const action = (context) => {
  console.log('Exec: command_center.read.scope.get', context);
  return context;
};
