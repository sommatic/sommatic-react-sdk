/**
 * Reports the capabilities currently enabled on the host:
 * available commands (read + exec) and registered insight sources.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { capabilities }
 */
export const action = (registry) => {
  const readCommands = [];
  const execCommands = [];

  const commands = registry?.commands || [];
  for (const cmd of commands) {
    const entry = { id: cmd.id, label: cmd.label, description: cmd.description };
    if (cmd.id.includes('.read.') || cmd.id.includes('.observe.') || cmd.id.includes('.extract.')) {
      readCommands.push(entry);
    } else {
      execCommands.push(entry);
    }
  }

  const sources = registry?.listAllSources?.() || [];

  return {
    capabilities: {
      read_commands: readCommands,
      exec_commands: execCommands,
      sources,
      surfaces: registry?.getSurfaces?.() || [],
    },
  };
};
