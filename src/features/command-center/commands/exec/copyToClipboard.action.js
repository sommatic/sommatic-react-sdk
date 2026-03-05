/**
 * Copies content to the system clipboard.
 * @param {Object} args
 * @param {string|Object} args.content - The content to copy. Objects are serialized to JSON.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with success status.
 */
export const action = async (args, registry) => {
  const { content } = args || {};

  if (content === undefined || content === null) {
    return { ok: false, error: { code: 'MISSING_CONTENT', message: 'No content provided to copy' } };
  }

  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  const receipt = registry?.pushReceipt?.({
    command_id: 'command_center.exec.clipboard.copy',
    args,
    reversible: false,
  });

  return { ok: true, title: 'Copied to clipboard', receipt_id: receipt?.id };
};
