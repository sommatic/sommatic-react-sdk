import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

function FlowsSaveModalContentComponent({ title, onClose, onConfirm, initialName = "", initialDescription = "" }) {
  // Hooks
  // ...

  // UI states
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  // Configs
  const textFieldStyles = {
    '& .MuiInputBase-input': { color: '#FFFFFF' },
    '& .MuiInputLabel-root': { color: '#AAAAAA' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FF6F5C' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF6F5C' }
  }

  // Component Functions
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onConfirm) {
      onConfirm({ name, description });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="p-3" sx={{ backgroundColor: "#171717" }}>
      <Typography variant="h5" className="mb-4" sx={{ fontWeight: 600, color: "#FFFFFF" }}>
        {title}
      </Typography>

      <Box className="mb-3">
        <TextField
          label="Name"
          placeholder="Enter name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          sx={{
            mb: 3,
            ...textFieldStyles,
          }}
        />

        <TextField
          label="Description"
          placeholder="Enter description"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={textFieldStyles}
        />
      </Box>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="text" onClick={onClose} sx={{ color: "#FFFFFF", textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!name.trim()}
          sx={{
            backgroundColor: "#FF6F5C",
            color: "#FFF",
            "&:hover": { backgroundColor: "#ff5540" },
            textTransform: "none",
          }}
        >
          Save
        </Button>
      </div>
    </Box>
  );
}

export default FlowsSaveModalContentComponent;
