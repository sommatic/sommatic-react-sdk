import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popper, Paper } from '@mui/material';
import styled from 'styled-components';

const SlashMenuPaper = styled(Paper)`
  background-color: #fff;
  color: #1a1a1a;
  border-radius: 10px;
  margin-bottom: 6px;
  min-width: 200px;
  max-width: 360px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

  scrollbar-width: thin;
  scrollbar-color: #5d4a7d transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #5d4a7d;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4e3875;
  }
`;

const SlashMenuHeading = styled.div`
  padding: 6px 10px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #5b4d7a;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const SlashMenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 6px;
  margin: 1px 4px;
  background-color: transparent;
  color: #1a1a1a;

  &:hover,
  &.slash-menu-item-selected {
    background-color: rgba(139, 92, 246, 0.12);
    color: #1a1a1a;
  }

  .slash-menu-item-icon {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5b4d7a;
  }

  .slash-menu-item-label {
    font-weight: 500;
    color: #1a1a1a;
  }

  .slash-menu-item-desc {
    font-size: 10px;
    color: #444;
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
`;

function SlashCommandMenu({
  open,
  anchorEl,
  commands = [],
  searchTerm = '',
  onClose,
  onSelectCommand,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  const filteredCommands = searchTerm
    ? commands.filter(
        (cmd) =>
          cmd.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : commands;

  const displayItems = filteredCommands;
  const maxIndex = Math.max(0, displayItems.length - 1);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i >= maxIndex ? 0 : i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i <= 0 ? maxIndex : i - 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const item = displayItems[selectedIndex];
        if (!item) return;
        onSelectCommand(item);
        onClose();
      }
    },
    [open, selectedIndex, maxIndex, displayItems, onSelectCommand, onClose],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [open, searchTerm]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !open) return;
    const option = el.querySelector('[data-selected="true"]');
    if (option) option.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, open]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  if (!open) {
    return null;
  }
  if (!anchorEl) {
    return null;
  }

  return (
    <Popper open={open} anchorEl={anchorEl} placement="top-start" disablePortal={false} style={{ zIndex: 1500 }}>
      <SlashMenuPaper elevation={8}>
        <SlashMenuHeading>Slash</SlashMenuHeading>
        <div
          ref={listRef}
          role="listbox"
          aria-label="Command list"
          style={{ paddingTop: 8, paddingBottom: 8 }}
          aria-activedescendant={
            displayItems[selectedIndex] ? `slash-cmd-${displayItems[selectedIndex].id}` : undefined
          }
        >
          {displayItems.length === 0 ? (
            <SlashMenuItem style={{ cursor: 'default', color: '#888' }}>
              <span className="slash-menu-item-label">No commands found</span>
            </SlashMenuItem>
          ) : (
            displayItems.map((item, index) => (
              <SlashMenuItem
                key={item.id}
                id={`slash-cmd-${item.id}`}
                role="option"
                aria-selected={index === selectedIndex}
                data-selected={index === selectedIndex}
                className={index === selectedIndex ? 'slash-menu-item-selected' : ''}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  onSelectCommand(item);
                  onClose();
                }}
              >
                <span className="slash-menu-item-icon">{item.icon || null}</span>
                <span className="slash-menu-item-label">{item.label}</span>
                {item.description && <span className="slash-menu-item-desc">{item.description}</span>}
              </SlashMenuItem>
            ))
          )}
        </div>
      </SlashMenuPaper>
    </Popper>
  );
}

export default SlashCommandMenu;
