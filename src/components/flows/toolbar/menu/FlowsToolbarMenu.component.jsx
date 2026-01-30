import React from "react";
import { Menu, MenuItem, ListItemText, Divider } from "@mui/material";

function FlowsToolbarMenuComponent({
  anchorEl,
  open,
  onClose,
  onDuplicate,
  onDownload,
  onRename,
  onImportFile,
  onPushGit,
  onSettings,
  onArchive,
}) {
  // Hooks
  // ...

  // Models
  // ...

  // UI states
  // ...

  // Configs

  // Component Functions

  const handleAction = (callback) => {
    if (callback) callback();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        "& .MuiPaper-root": {
          backgroundColor: "#171717",
          color: "#E0E0E0",
          minWidth: "220px",
          border: "1px solid #444",
          borderRadius: "4px",
          marginTop: "8px",
        },
        "& .MuiMenuItem-root": {
          fontSize: "0.5rem",
          padding: "3px 16px",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      }}
    >
      <MenuItem onClick={() => handleAction(onDuplicate)}>
        <ListItemText>Duplicate</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction(onDownload)}>
        <ListItemText>Download</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction(onRename)}>
        <ListItemText>Rename</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction(onImportFile)}>
        <ListItemText>Import from File...</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction(onPushGit)} disabled>
        <ListItemText sx={{ color: "#777" }}>Push to Git</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction(onSettings)}>
        <ListItemText>Settings</ListItemText>
      </MenuItem>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <MenuItem onClick={() => handleAction(onArchive)}>
        <ListItemText sx={{ color: "#FF6F5C" }}>Archive</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export default FlowsToolbarMenuComponent;
