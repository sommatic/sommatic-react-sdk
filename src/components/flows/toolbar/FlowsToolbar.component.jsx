import React, { useState, useRef } from "react";
import { Button, Typography, IconButton, Box, Chip, Popover, TextField } from "@mui/material";
import FlowsToolbarMenuComponent from "./menu/FlowsToolbarMenu.component";
import FlowsSaveModalContentComponent from "../save-modal/FlowsSaveModalContent.component";
import { PopUp, openSnackbar } from "@link-loom/react-sdk";
import {
  PersonOutline as PersonIcon,
  Publish as PublishIcon,
  History as HistoryIcon,
  MoreHoriz as MoreIcon,
  Save as SaveIcon,
  LocalOffer as TagIcon,
  Add as AddIcon,
  Undo as UndoIcon,
  Redo as RedoIcon
} from "@mui/icons-material";
import { Badge } from "@mui/material";

import { Divider, Menu, MenuItem, ListItemText } from "@mui/material";

function FlowsToolbarComponent({ flow, onSave, onFlowChange, onBack, isSaving, isDirty, onDuplicate, onDownload, onRename, onImportFile, onPublish, history, onUndo, onRedo, versions, onRestore, onOpenHistory, onSettings }) {
  // Hooks
  const fileInputRef = useRef(null);

  // Models
  // ...

  // UI states
  const [isConfirm, setIsConfirm] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  // Tag state
  const [tagAnchorEl, setTagAnchorEl] = useState(null);
  const [newTag, setNewTag] = useState("");

  const handleTagClick = (event) => {
    setTagAnchorEl(event.currentTarget);
  };

  const handleTagClose = () => {
    setTagAnchorEl(null);
    setNewTag("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && flow) {
      const currentTags = flow.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        const updatedTags = [...currentTags, newTag.trim()];
        // Notify parent
        if (onFlowChange) {
          onFlowChange({ ...flow, tags: updatedTags });
        }
      }
      handleTagClose();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (flow && onFlowChange) {
      const updatedTags = (flow.tags || []).filter(t => t !== tagToRemove);
      onFlowChange({ ...flow, tags: updatedTags });
    }
  };

  const openMenu = Boolean(anchorEl);
  const openHistoryMenu = Boolean(historyAnchorEl);
  const openTagPopover = Boolean(tagAnchorEl);
  const [alertInfo, setAlertInfo] = useState({
    message: '',
    type: null,
  });

  // Configs

  // Component Functions
  const handleSaveClick = (data) => {
    //setActiveModal("save");
    console.log("Saving flow:", data);
    if (onSave) onSave(data);
    openSnackbar("Flow saved successfully", 'success');
  };

  const handleSettingsClick = () => {
    if (onSettings) {
      onSettings();
    } else {
      setActiveModal("settings");
    }
  };

  const handleRenameClick = () => {
    setActiveModal("rename");
  };

  const handleConfirmSave = (data) => {
    console.log("Saving flow:", data);
    if (onSave) onSave(data);
    setActiveModal(null);
  };

  const handleConfirmRename = (data) => {
    if (onRename && data) {
      onRename(data);
    }
    setActiveModal(null);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          if (onImportFile) onImportFile(json);
        } catch (error) {
          console.error("Error parsing JSON", error);
          openSnackbar("Error parsing JSON file", "error");
        }
      };
      reader.readAsText(file);
    }
    // Reset value to allow re-importing the same file
    event.target.value = null;
  };

  const getAlertConfig = () => {
    return {
      title: 'Confirm exit',
      description: "Are you sure you want to exit?",
      typeIcon: "error",
      confirmButtonText: "Accept",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    };
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json"
        onChange={handleFileChange}
      />
      <Box
        sx={{
          backgroundColor: "#212121",
          borderBottom: isDirty ? "2px solid #F59E0B" : "1px solid #333",
          transition: "border-bottom 0.3s ease",
          color: "#E0E0E0",
          height: "56px",
          position: "sticky",
          width: "calc(100% + 48px)",
          marginLeft: "-24px",
          marginRight: "-24px",
          marginBottom: "20px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          {/* Metadata: Category */}
          <Box className="d-flex align-items-center text-muted" sx={{ fontSize: "0.9rem" }}>
            <PersonIcon sx={{ fontSize: 18, mr: 0.5, color: "#9E9E9E" }} />
            <Box component="span" sx={{ color: "#E0E0E0", textTransform: "capitalize" }}>
              {flow?.category || "Uncategorized"}
            </Box>
            <span className="mx-2 text-secondary">/</span>
          </Box>

          {/* Title */}
          <Typography variant="body1" sx={{ fontWeight: 600, color: "#FFFFFF", fontSize: "0.95rem" }}>
            {flow?.name || "Untitled Flow"}
          </Typography>

          {/* Unsaved Indicator */}
          {isDirty && (
            <Chip
              label="Unsaved"
              size="small"
              sx={{
                ml: 1,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                color: "#F59E0B",
                border: "1px solid #F59E0B",
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 600
              }}
            />
          )}

          {/* Tags List */}
          {(flow?.tags || []).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => handleRemoveTag(tag)}
              sx={{
                ml: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#ccc",
                height: 24,
                "& .MuiChip-deleteIcon": {
                  color: "#666",
                  "&:hover": { color: "#ff6f5c" }
                }
              }}
            />
          ))}

          {/* Add Tag Button */}
          <IconButton
            size="small"
            onClick={handleTagClick}
            sx={{
              ml: 1,
              color: "#ADADAD",
              "&:hover": { color: "#FFF", backgroundColor: "rgba(255,255,255,0.1)" },
            }}
            title="Add tag"
          >
            <TagIcon style={{ fontSize: 16 }} />
            <AddIcon style={{ fontSize: 14 }} />
          </IconButton>

          {/* Add Tag Popover */}
          <Popover
            open={openTagPopover}
            anchorEl={tagAnchorEl}
            onClose={handleTagClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#2c2c2c' }}>
              <TextField
                size="small"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#777' },
                  }
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddTag}
                sx={{ bgcolor: '#FF6F5C', '&:hover': { bgcolor: '#ff5540' } }}
              >
                Add
              </Button>
            </Box>
          </Popover>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Undo / Redo */}
          <div className="d-flex align-items-center gap-1 bg-dark rounded-1 px-1 border border-secondary border-opacity-25" style={{ height: "32px" }}>
            <IconButton
              size="small"
              onClick={onUndo}
              disabled={!history?.past?.length}
              sx={{ color: "#E0E0E0", "&.Mui-disabled": { color: "#555" } }}
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onRedo}
              disabled={!history?.future?.length}
              sx={{ color: "#E0E0E0", "&.Mui-disabled": { color: "#555" } }}
              title="Redo (Ctrl+Y)"
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </div>
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={isSaving}
            sx={{
              backgroundColor: isSaving ? "#666" : "#FF6F5C",
              color: "#FFFFFF",
              textTransform: "none",
              height: "32px",
              fontWeight: 600,
              borderRadius: "4px",
              boxShadow: "none",
              px: 3,
              "&:hover": { backgroundColor: isSaving ? "#666" : "#ff5540" },
              "&.Mui-disabled": { backgroundColor: "#666", color: "#bbb" }
            }}
          >
            <Badge color="warning" variant="dot" invisible={!isDirty} sx={{ "& .MuiBadge-badge": { right: -3, top: 3 } }}>
              <SaveIcon fontSize="small" sx={{ color: isSaving ? "#bbb" : "#FFFFFF", mr: 1 }} />
              {isSaving ? "Saving..." : "Save"}
            </Badge>
          </Button>

          <Button
            variant="outlined"
            onClick={onPublish}
            disabled={isSaving}
            sx={{
              color: "#E0E0E0",
              borderColor: "#444",
              bgcolor: "#1C1C1C",
              textTransform: "none",
              height: "32px",
              fontWeight: 600,
              borderRadius: "4px",
              px: 2,
              "&:hover": {
                borderColor: "#666",
                bgcolor: "#2D2D2D",
              },
            }}
          >
            <PublishIcon fontSize="small" sx={{ color: "#FFFFFF", mr: 1 }} />
            Publish
          </Button>

          <IconButton
            size="small"
            sx={{ color: "#9E9E9E", bgcolor: openHistoryMenu ? "rgba(255,255,255,0.1)" : "transparent" }}
            onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>

          {/* History Menu */}
          <Menu
            anchorEl={historyAnchorEl}
            open={openHistoryMenu}
            onClose={() => setHistoryAnchorEl(null)}
            PaperProps={{
              sx: {
                bgcolor: "#1E1E1E",
                color: "#E0E0E0",
                border: "1px solid #444",
                mt: 1,
                minWidth: 200
              }
            }}
          >
            <div className="px-3 py-2 text-muted small border-bottom border-dark">
              Recent Versions
            </div>
            {(versions || []).slice(0, 5).map((v) => (
              <MenuItem
                key={v.id}
                onClick={() => { onRestore(v); setHistoryAnchorEl(null); }}
                sx={{ fontSize: '0.85rem' }}
              >
                <ListItemText
                  primary={`v${v.version}`}
                  secondary={(() => {
                    const raw = v.created?.timestamp || v.created;
                    if (!raw) return '-';
                    let d = new Date(raw);
                    if (isNaN(d.getTime())) d = new Date(+raw);
                    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
                  })()}
                  secondaryTypographyProps={{ style: { fontSize: '0.7rem', color: '#888' } }}
                />
              </MenuItem>
            ))}
            {(!versions || versions.length === 0) && (
              <div className="p-3 text-center text-muted small">No versions yet</div>
            )}
            <Divider sx={{ borderColor: "#444" }} />
            <MenuItem onClick={() => { onOpenHistory(); setHistoryAnchorEl(null); }}>
              <ListItemText primary="View all history..." sx={{ color: "#A78BFA", fontSize: '0.85rem' }} />
            </MenuItem>
          </Menu>

          <IconButton
            size="small"
            sx={{
              color: "#9E9E9E",
              bgcolor: openMenu ? "rgba(255,255,255,0.1)" : "transparent",
              borderRadius: "4px",
            }}
            onClick={handleMenuClick}
            aria-controls={openMenu ? "header-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={openMenu ? "true" : undefined}
          >
            <MoreIcon fontSize="small" />
          </IconButton>

          <FlowsToolbarMenuComponent
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            onDuplicate={onDuplicate}
            onDownload={onDownload}
            onRename={handleRenameClick}
            onImportFile={handleImportClick}
            onSettings={handleSettingsClick}
            onArchive={() => { }}
          />
        </div>
      </Box>
      <PopUp
        data-testid="popup-modal"
        id="popup-modal"
        isOpen={Boolean(activeModal)}
        setIsOpen={(isOpen) => setActiveModal(isOpen ? activeModal : null)}
        className="col-lg-4 col-md-8 col-12"
        styles={{
          closeButtonColor: "text-white",
        }}
      >
        {(activeModal === "save" || activeModal === "settings" || activeModal === "rename") && (
          <FlowsSaveModalContentComponent
            onClose={() => setActiveModal(null)}
            onConfirm={activeModal === "rename" ? handleConfirmRename : handleConfirmSave}
            initialName={flow?.name || ""}
            initialDescription={flow?.description || ""}
            title={activeModal === "settings" ? "Settings" : activeModal === "rename" ? "Rename flow" : "Save flow"}
          />
        )}
      </PopUp>

    </>
  );
}

export default FlowsToolbarComponent;
