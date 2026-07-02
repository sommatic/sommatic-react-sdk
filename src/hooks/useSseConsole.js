import { useCallback, useRef, useState } from 'react';

const safeStringify = (value, spacing = 2) => {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;
      return val;
    },
    spacing,
  );
};

const formatValue = (value) => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'function') return value.toString();
  try {
    return safeStringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Controller for the SSE developer console (FlowsSseConsole).
 *
 * Collects raw SSE events with stable ids (evt-1, evt-2, ...) and evaluates
 * JavaScript commands against them. The evaluation context exposes:
 *   $('evt-3') / $(3)  -> event object by id or sequence number
 *   $events            -> all collected events
 *   $last              -> most recent event
 *   console.log/...    -> captured into the console output (and passed through)
 * Everything else is plain page JavaScript (Math, JSON, fetch, await, ...).
 */
export function useSseConsole() {
  const [items, setItems] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);

  const eventSeqRef = useRef(0);
  const ordinalRef = useRef(0);
  const eventsRef = useRef([]);

  const appendItem = useCallback((item) => {
    ordinalRef.current += 1;
    const stamped = { ...item, ordinal: ordinalRef.current, receivedAt: Date.now() };
    setItems((previous) => [...previous, stamped]);
    return stamped;
  }, []);

  const push = useCallback(
    (eventName, data) => {
      eventSeqRef.current += 1;
      const seq = eventSeqRef.current;
      const event = {
        kind: 'event',
        id: `evt-${seq}`,
        seq,
        eventName: eventName || 'message',
        data,
      };
      eventsRef.current = [...eventsRef.current, event];
      appendItem(event);
    },
    [appendItem],
  );

  const clear = useCallback(() => {
    eventsRef.current = [];
    setItems([]);
  }, []);

  const reset = useCallback(() => {
    eventsRef.current = [];
    eventSeqRef.current = 0;
    ordinalRef.current = 0;
    setItems([]);
  }, []);

  const evaluate = useCallback(
    async (code) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) return;

      appendItem({ kind: 'command', text: trimmed });
      setCommandHistory((previous) => {
        if (previous[previous.length - 1] === trimmed) return previous;
        return [...previous.slice(-99), trimmed];
      });

      const eventsSnapshot = eventsRef.current;
      const dollar = (idOrSeq) => {
        if (typeof idOrSeq === 'number') {
          return eventsSnapshot.find((event) => event.seq === idOrSeq) || null;
        }
        const key = String(idOrSeq);
        return (
          eventsSnapshot.find(
            (event) => event.id === key || event.id === `evt-${key}`,
          ) || null
        );
      };
      const lastEvent = eventsSnapshot[eventsSnapshot.length - 1] || null;

      const capturedConsole = {
        log: (...args) => {
          appendItem({ kind: 'log', text: args.map(formatValue).join(' ') });
          console.log(...args);
        },
        info: (...args) => {
          appendItem({ kind: 'log', text: args.map(formatValue).join(' ') });
          console.info(...args);
        },
        warn: (...args) => {
          appendItem({ kind: 'warn', text: args.map(formatValue).join(' ') });
          console.warn(...args);
        },
        error: (...args) => {
          appendItem({ kind: 'error', text: args.map(formatValue).join(' ') });
          console.error(...args);
        },
      };

      let runner = null;
      try {
        // Expression form first (`$events.length`, `1 + 1`), statement body as
        // fallback (`const x = 1; x + 1` or multi-line commands).
        runner = new Function(
          '$',
          '$events',
          '$last',
          'console',
          `return (async () => (${trimmed}))()`,
        );
      } catch {
        try {
          runner = new Function(
            '$',
            '$events',
            '$last',
            'console',
            `return (async () => { ${trimmed} })()`,
          );
        } catch (syntaxError) {
          appendItem({ kind: 'error', text: String(syntaxError?.message || syntaxError) });
          return;
        }
      }

      try {
        const result = await runner(dollar, eventsSnapshot, lastEvent, capturedConsole);
        appendItem({ kind: 'result', text: formatValue(result) });
      } catch (runtimeError) {
        appendItem({ kind: 'error', text: String(runtimeError?.message || runtimeError) });
      }
    },
    [appendItem],
  );

  return {
    items,
    events: eventsRef,
    commandHistory,
    push,
    clear,
    reset,
    evaluate,
  };
}

export default useSseConsole;
