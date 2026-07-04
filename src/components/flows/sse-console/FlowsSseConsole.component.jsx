import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Close as CloseIcon,
  DeleteSweep as ClearIcon,
  Fullscreen as MaximizeIcon,
  FullscreenExit as RestoreIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import {
  CommandArea,
  CommandEditorWrap,
  CommandPrompt,
  ConsoleBody,
  ConsoleDock,
  ConsoleTitle,
  ConsoleToolbar,
  EmptyState,
  EventIdChip,
  EventNameChip,
  ItemErrorPreview,
  ItemNodeName,
  ItemNodeSlug,
  ItemPreview,
  ItemRow,
  ItemTimestamp,
  PayloadBlock,
  ReplLine,
  ReplPrompt,
  SearchInput,
} from './FlowsSseConsole.styles.js';

const EVENT_COLOR_MAP = {
  'node-step-started': { color: '#B45309', bg: '#FEF3C7' },
  'node-step-completed': { color: '#0F766E', bg: '#CCFBF1' },
  'execution-completed': { color: '#166534', bg: '#DCFCE7' },
  'execution-failed': { color: '#9F1239', bg: '#FFE4E6' },
  'webhook-received': { color: '#4338CA', bg: '#E0E7FF' },
  'chain-received': { color: '#6D28D9', bg: '#EDE9FE' },
  'workflow-paused': { color: '#B45309', bg: '#FEF3C7' },
  'task-assigned': { color: '#0369A1', bg: '#E0F2FE' },
  connected: { color: '#374151', bg: '#F3F4F6' },
  'keep-alive': { color: '#9CA3AF', bg: '#F9FAFB' },
  error: { color: '#9F1239', bg: '#FFE4E6' },
};

const API_DOCS = {
  $: [
    '**$(id)** — Returns a captured SSE event by id or sequence number.',
    '',
    'Examples:',
    '```javascript',
    "$('evt-3')        // full event object",
    "$('evt-3').data   // its payload",
    '$(3)              // same event, by sequence number',
    '```',
  ].join('\n'),
  $events: [
    '**$events** — Array with every captured SSE event of this run.',
    '',
    'Examples:',
    '```javascript',
    '$events.length',
    '$events.map(e => e.eventName)',
    "$events.filter(e => e.eventName === 'node-step-completed')",
    '```',
  ].join('\n'),
  $last: [
    '**$last** — The most recent captured SSE event (or null).',
    '',
    'Example:',
    '```javascript',
    '$last.eventName',
    '```',
  ].join('\n'),
};

const EXTRA_TYPINGS = `
declare interface SseConsoleEvent {
  /** Stable event id, e.g. 'evt-3'. */
  id: string;
  /** Sequence number within the run. */
  seq: number;
  /** SSE event name, e.g. 'node-step-completed'. */
  eventName: string;
  /** Reception timestamp (ms). */
  receivedAt: number;
  /** Raw event payload. */
  data: any;
}
/** Returns a captured SSE event by id ('evt-3') or sequence number (3). */
declare function $(idOrSeq: string | number): SseConsoleEvent;
/** Every captured SSE event of this run. */
declare const $events: SseConsoleEvent[];
/** The most recent captured SSE event. */
declare const $last: SseConsoleEvent;
`;

const ARRAY_METHOD_SUGGESTIONS = ['length', 'map', 'filter', 'find', 'forEach', 'slice', 'join', 'some', 'every'];

// Resolves the runtime object referenced by a member-access chain rooted at the
// console context ($('evt-N'), $(N), $last, $events[N]) so completions can list
// the REAL keys of dynamic payloads.
const resolveMemberChain = (textUntilPosition, events) => {
  const match = textUntilPosition.match(
    /(\$\(\s*(?:'[^']*'|"[^"]*"|\d+)\s*\)|\$last|\$events\[\d+\])((?:\.[\w$]+|\[\d+\])*)\.\s*[\w$]*$/,
  );
  if (!match) return null;

  const baseExpr = match[1];
  const chainExpr = match[2] || '';

  let base = null;
  const callMatch = baseExpr.match(/\$\(\s*(?:'([^']*)'|"([^"]*)"|(\d+))\s*\)/);
  if (callMatch) {
    const key = callMatch[1] || callMatch[2] || null;
    const seq = callMatch[3] ? Number(callMatch[3]) : null;
    base =
      events.find((event) => (key && (event.id === key || event.id === `evt-${key}`)) || (seq !== null && event.seq === seq)) ||
      null;
  } else if (baseExpr === '$last') {
    base = events[events.length - 1] || null;
  } else {
    const indexMatch = baseExpr.match(/\$events\[(\d+)\]/);
    base = indexMatch ? events[Number(indexMatch[1])] || null : null;
  }
  if (!base) return null;

  let value = base;
  const parts = chainExpr.match(/\.[\w$]+|\[\d+\]/g) || [];
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = part.startsWith('.') ? value[part.slice(1)] : value[Number(part.slice(1, -1))];
  }
  if (value === null || value === undefined || typeof value !== 'object') return null;
  return value;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

const previewPayload = (data) => {
  if (data === null || data === undefined) return '';
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

// Error carried by an event, from any of its three sources: a relayed chain
// step failure (`chain_step.error`), a hard node failure (`error`), or a soft
// failure envelope routed to the error port (`output` of a failed step).
// Returns `{ message, http_status?, detail? }` or null.
const extractEventError = (data) => {
  if (!data) return null;

  const chainError = data.chain_step?.error;
  if (chainError && (chainError.message || chainError.detail)) {
    return chainError;
  }

  if (data.error?.message) {
    return data.error;
  }

  const failed = data.status === 'failed' || data.chain_step?.status === 'failed';
  const output = data.output;
  if (!failed || !output || typeof output !== 'object') return null;

  const message = output.message || output.error || null;
  const httpStatus = typeof output.status === 'number' ? output.status : null;
  if (!message && httpStatus === null) return null;

  return {
    message: typeof message === 'string' ? message : null,
    http_status: httpStatus,
    detail: output.response || output.data ? JSON.stringify(output.response ?? output.data) : null,
  };
};

const eventErrorText = (eventError) =>
  [
    eventError.http_status ? `HTTP ${eventError.http_status}` : null,
    eventError.message || eventError.detail || 'failed',
  ]
    .filter(Boolean)
    .join(' · ');

const prettyPayload = (data) => {
  if (data === null || data === undefined) return 'null';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

// Full-depth searchable text per item, cached by item identity (items are
// immutable once appended). Circular-safe: a cycle is dropped, never thrown —
// a throw here would silently empty the haystack and hide matching events.
const searchBlobCache = new WeakMap();
const searchableText = (item) => {
  if (searchBlobCache.has(item)) return searchBlobCache.get(item);

  let blob = '';
  if (item.kind === 'event') {
    let payloadText = '';
    try {
      const seen = new WeakSet();
      payloadText =
        JSON.stringify(item.data, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return undefined;
            seen.add(value);
          }
          return value;
        }) || '';
    } catch {
      payloadText = '';
    }
    blob = `${item.id} ${item.eventName} ${payloadText}`.toLowerCase();
  } else {
    blob = String(item.text || '').toLowerCase();
  }

  searchBlobCache.set(item, blob);
  return blob;
};

const itemMatchesSearch = (item, needle) => {
  if (!needle) return true;
  return searchableText(item).includes(needle);
};

function EventRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const palette = EVENT_COLOR_MAP[item.eventName] || {};
  // A relayed sub-workflow step (workflow.chain) carries the REAL executing
  // node inside `chain_step` — surface that instead of the chain node itself,
  // otherwise every relayed event reads identically ("workflow.chain").
  const chainStep = item.data?.chain_step || null;
  const nodeSlug = chainStep?.operator_slug || item.data?.operatorSlug || item.data?.operator_slug || null;
  const rawNodeName = chainStep?.node_name || item.data?.nodeName || item.data?.node_name || null;
  const nodeName = chainStep ? `↳ ${rawNodeName || chainStep.node_id || ''}`.trim() : rawNodeName;
  // A failed step's error replaces the generic JSON preview — reading the
  // failure reason at a glance is the whole point of a debug console.
  const eventError = extractEventError(item.data);

  const onCopyId = (e) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <>
      <ItemRow $expandable onClick={() => setExpanded(!expanded)}>
        <ItemTimestamp>{formatTime(item.receivedAt)}</ItemTimestamp>
        <Tooltip title={copied ? 'Copied!' : 'Copy event id'} placement="top" arrow>
          <EventIdChip onClick={onCopyId}>{item.id}</EventIdChip>
        </Tooltip>
        {/* Slug and name columns always render (empty when absent) so every
            row keeps the same column grid — no zig-zag while scrolling. */}
        <Tooltip title={nodeSlug || ''} placement="top" arrow disableHoverListener={!nodeSlug}>
          <ItemNodeSlug>{nodeSlug || ''}</ItemNodeSlug>
        </Tooltip>
        <EventNameChip $color={palette.color} $bg={palette.bg}>
          {item.eventName}
        </EventNameChip>
        <Tooltip title={nodeName || ''} placement="top" arrow disableHoverListener={!nodeName}>
          <ItemNodeName>{nodeName || ''}</ItemNodeName>
        </Tooltip>
        {eventError ? (
          <Tooltip title={eventError.detail || eventError.message || ''} placement="top" arrow>
            <ItemErrorPreview>✕ {eventErrorText(eventError)}</ItemErrorPreview>
          </Tooltip>
        ) : (
          <ItemPreview>{previewPayload(item.data)}</ItemPreview>
        )}
      </ItemRow>
      {expanded && <PayloadBlock>{prettyPayload(item.data)}</PayloadBlock>}
    </>
  );
}

function ReplRow({ item }) {
  const promptByKind = {
    command: '❯',
    result: '←',
    log: '·',
    warn: '⚠',
    error: '✕',
  };

  return (
    <ReplLine $kind={item.kind}>
      <ReplPrompt $kind={item.kind}>{promptByKind[item.kind] || '·'}</ReplPrompt>
      <span>{item.text}</span>
    </ReplLine>
  );
}

/**
 * Developer console for raw SSE events, VS Code debug-console style.
 * Renders captured events interleaved with REPL commands/outputs, with a
 * Monaco-powered JavaScript command input (full JS API + IntelliSense for the
 * console context: $, $events, $last).
 *
 * Props:
 * - open: whether the dock is visible (state accumulates while hidden).
 * - maximized / onToggleMaximize: dock height control.
 * - onClose: minimize the dock.
 * - controller: the object returned by useSseConsole().
 */
export function FlowsSseConsole({ open, maximized = false, onToggleMaximize, onClose, controller }) {
  // -----------------------------------------------------
  // Models / State
  // -----------------------------------------------------
  const { items, commandHistory, clear, evaluate } = controller;

  // -----------------------------------------------------
  // UI States
  // -----------------------------------------------------
  const [search, setSearch] = useState('');

  // -----------------------------------------------------
  // Configs / Constants
  // -----------------------------------------------------
  const bodyRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const itemsRef = useRef(items);
  const historyRef = useRef(commandHistory);
  const historyIndexRef = useRef(null);
  const disposablesRef = useRef([]);

  itemsRef.current = items;
  historyRef.current = commandHistory;

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => itemMatchesSearch(item, needle));
  }, [items, search]);

  // -----------------------------------------------------
  // Component Functions
  // -----------------------------------------------------
  const runCommand = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const code = editor.getValue();
    if (!code.trim()) return;

    editor.setValue('');
    historyIndexRef.current = null;
    evaluate(code);
  }, [evaluate]);

  const navigateHistory = useCallback((direction) => {
    const editor = editorRef.current;
    const history = historyRef.current;
    if (!editor || history.length === 0) return;

    const currentIndex = historyIndexRef.current;
    let nextIndex = null;

    if (direction === 'up') {
      nextIndex = currentIndex === null ? history.length - 1 : Math.max(0, currentIndex - 1);
    } else {
      if (currentIndex === null) return;
      nextIndex = currentIndex + 1;
      if (nextIndex >= history.length) {
        historyIndexRef.current = null;
        editor.setValue('');
        return;
      }
    }

    historyIndexRef.current = nextIndex;
    editor.setValue(history[nextIndex]);
    const model = editor.getModel();
    const lastLine = model.getLineCount();
    editor.setPosition({ lineNumber: lastLine, column: model.getLineMaxColumn(lastLine) });
  }, []);

  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        allowJs: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      disposablesRef.current.push(
        monaco.languages.typescript.javascriptDefaults.addExtraLib(EXTRA_TYPINGS, 'ts:sse-console-context.d.ts'),
      );

      disposablesRef.current.push(
        monaco.languages.registerCompletionItemProvider('javascript', {
          triggerCharacters: ['$', '.', '('],
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };
            const textUntilPosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });
            const liveEvents = itemsRef.current.filter((item) => item.kind === 'event');

            // Member access (`something.`): never re-offer the root context
            // ($('evt-N') / $events / $last). Resolve the chain against the
            // live event objects and list the REAL keys of the target value.
            const beforeWord = textUntilPosition.slice(0, textUntilPosition.length - word.word.length).trimEnd();
            const isMemberAccess = beforeWord.endsWith('.');

            if (isMemberAccess) {
              const target = resolveMemberChain(textUntilPosition, liveEvents);
              if (!target) return { suggestions: [] };

              if (Array.isArray(target)) {
                const arraySuggestions = ARRAY_METHOD_SUGGESTIONS.map((name) => ({
                  label: name,
                  kind:
                    name === 'length' ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Method,
                  insertText: name === 'length' ? 'length' : `${name}(`,
                  detail: name === 'length' ? `${target.length}` : 'Array method',
                  range,
                }));
                return { suggestions: arraySuggestions };
              }

              const keySuggestions = Object.keys(target)
                .slice(0, 200)
                .map((key) => {
                  const value = target[key];
                  const valueType = Array.isArray(value) ? `array(${value.length})` : typeof value;
                  return {
                    label: key,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: key,
                    detail: valueType,
                    documentation: {
                      value: `\`\`\`json\n${prettyPayload(value).slice(0, 600)}\n\`\`\``,
                    },
                    range,
                  };
                });
              return { suggestions: keySuggestions };
            }

            const eventSuggestions = liveEvents.slice(-50).map((event) => ({
              label: `$('${event.id}')`,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: `$('${event.id}')`,
              detail: event.eventName,
              documentation: {
                value: `Event **${event.id}** — \`${event.eventName}\`\n\n\`\`\`json\n${prettyPayload(event.data).slice(0, 800)}\n\`\`\``,
              },
              range,
            }));

            const apiSuggestions = [
              {
                label: '$events',
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: '$events',
                documentation: { value: API_DOCS.$events },
                range,
              },
              {
                label: '$last',
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: '$last',
                documentation: { value: API_DOCS.$last },
                range,
              },
              {
                label: '$(id)',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: "$('${1:evt-1}')",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: { value: API_DOCS.$ },
                range,
              },
            ];

            return { suggestions: [...apiSuggestions, ...eventSuggestions] };
          },
        }),
      );

      disposablesRef.current.push(
        monaco.languages.registerHoverProvider('javascript', {
          provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            const token = word.word;
            const docKey = token === 'events' ? '$events' : token === 'last' ? '$last' : null;
            if (!docKey) return null;
            return { contents: [{ value: API_DOCS[docKey] }] };
          },
        }),
      );

      // Enter runs the command (unless the suggest widget is open);
      // Shift+Enter keeps Monaco's default newline behavior.
      editor.addCommand(monaco.KeyCode.Enter, runCommand, '!suggestWidgetVisible');
      editor.addCommand(
        monaco.KeyCode.UpArrow,
        () => {
          const position = editor.getPosition();
          if (position.lineNumber === 1) {
            navigateHistory('up');
            return;
          }
          editor.trigger('keyboard', 'cursorUp', null);
        },
        '!suggestWidgetVisible',
      );
      editor.addCommand(
        monaco.KeyCode.DownArrow,
        () => {
          const position = editor.getPosition();
          const lastLine = editor.getModel().getLineCount();
          if (position.lineNumber === lastLine) {
            navigateHistory('down');
            return;
          }
          editor.trigger('keyboard', 'cursorDown', null);
        },
        '!suggestWidgetVisible',
      );
    },
    [navigateHistory, runCommand],
  );

  // -----------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [filteredItems.length, open]);

  useEffect(() => {
    return () => {
      for (const disposable of disposablesRef.current) {
        disposable?.dispose?.();
      }
      disposablesRef.current = [];
    };
  }, []);

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
  if (!open) return null;

  return (
    <ConsoleDock $maximized={maximized}>
      <ConsoleToolbar>
        <ConsoleTitle>Debug Console</ConsoleTitle>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter events (any field, deep)..."
        />
        <span style={{ flex: 1 }} />
        <Tooltip title="Clear console" arrow>
          <IconButton size="small" onClick={clear}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={maximized ? 'Restore' : 'Maximize'} arrow>
          <IconButton size="small" onClick={onToggleMaximize}>
            {maximized ? <RestoreIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Close" arrow>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ConsoleToolbar>

      <ConsoleBody ref={bodyRef}>
        {filteredItems.length === 0 && (
          <EmptyState>
            {items.length === 0
              ? "No SSE events yet. Run the workflow to start streaming events. Use the command input below to inspect them: $('evt-1'), $events, $last."
              : 'No items match the current filter.'}
          </EmptyState>
        )}
        {filteredItems.map((item) =>
          item.kind === 'event' ? (
            <EventRow key={`${item.ordinal}`} item={item} />
          ) : (
            <ReplRow key={`${item.ordinal}`} item={item} />
          ),
        )}
      </ConsoleBody>

      <CommandArea>
        <CommandPrompt>❯</CommandPrompt>
        <CommandEditorWrap>
          <Editor
            height="64px"
            language="javascript"
            defaultValue=""
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              wordWrap: 'on',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              automaticLayout: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, strings: true },
              scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
              fixedOverflowWidgets: true,
            }}
          />
        </CommandEditorWrap>
      </CommandArea>
    </ConsoleDock>
  );
}

export default FlowsSseConsole;
