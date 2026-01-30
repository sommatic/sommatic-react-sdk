import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Button,
  ButtonGroup,
  Divider
} from "@mui/material";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandMore,
  ChevronRight,
  DataObject as VariableIcon,
  TextFields as TextIcon,
  AccessTime as TimeIcon,
  Code as CodeIcon,
  CheckBox as CheckBoxIcon,
  Inventory2 as BoxIcon
} from "@mui/icons-material";

function FlowsExpressionModalComponent({ open, onClose, initialValue = "" }) {
  // Configs
  // Removed variables to inline them

  // States
  const [expression, setExpression] = useState(initialValue || "{{ $json.chatInput }}");
  const [varsOpen, setVarsOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: "#2B2B2B",
          backgroundImage: "none",
          color: "#E0E0E0",
          width: "90vw",
          height: "90vh", // Un poco menos que el otro para diferenciar, o 100vh si prefieres
          maxWidth: "none",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden", height: "100%" }}>
        <div className="container-fluid h-100 p-0">
          <div className="row g-0 h-100">
            
            {/* LEFT COLUMN: Sidebar / Variables */}
            <div 
              className="col-lg-3 border-end h-100 overflow-auto d-flex flex-column">
              {/* Search */}
              <div className="p-3">
                <TextField
                  fullWidth
                  placeholder="Search previous nodes' fields"
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#111",
                      color: "#E0E0E0",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      "& fieldset": { borderColor: "transparent" },
                      "&:hover fieldset": { borderColor: "#555" },
                      "&.Mui-focused fieldset": { borderColor: "#FF6F5C" },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#9E9E9E", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              {/* Tree */}
              <div className="flex-grow-1 overflow-auto">
                <List component="nav" dense>
                  {/* Node Item */}
                  <ListItemButton sx={{ py: 0.5 }}>
                     <ListItemIcon sx={{ minWidth: 28 }}><ExpandMore sx={{ fontSize: 18, color: "#9E9E9E" }} /></ListItemIcon>
                     <ListItemIcon sx={{ minWidth: 28 }}><BoxIcon sx={{ fontSize: 16, color: "#E0E0E0" }} /></ListItemIcon>
                     <ListItemText 
                        primary="AI Agent3" 
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, color: "#E0E0E0" }} 
                     />
                  </ListItemButton>
                   <Typography variant="caption" sx={{ display: "block", px: 7, pb: 1, color: "#9E9E9E", lineHeight: 1.2 }}>
                      No fields - node executed, but no items were sent on this branch
                   </Typography>

                  {/* Variables Item */}
                  <ListItemButton onClick={() => setVarsOpen(!varsOpen)} sx={{ py: 0.5 }}>
                     <ListItemIcon sx={{ minWidth: 28 }}>
                         {varsOpen ? <ExpandMore sx={{ fontSize: 18, color: "#9E9E9E" }} /> : <ChevronRight sx={{ fontSize: 18, color: "#9E9E9E" }} />}
                     </ListItemIcon>
                     <ListItemText 
                        primary="Variables and context" 
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, color: "#E0E0E0" }} 
                     />
                  </ListItemButton>

                  <Collapse in={varsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {[
                            { icon: TextIcon, label: "$now", val: "2025-12-12T08:13:..." },
                            { icon: TextIcon, label: "$today", val: "2025-12-12T00:00:..." },
                            { icon: VariableIcon, label: "$vars", val: "" },
                            { icon: VariableIcon, label: "$execution", val: "" },
                            { icon: VariableIcon, label: "$workflow", val: "" },
                        ].map((item, idx) => (
                             <ListItemButton key={idx} sx={{ pl: 4, py: 0.2 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                    <item.icon sx={{ fontSize: 14, color: "#9E9E9E" }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <div className="d-flex align-items-center gap-2">
                                            <span>{item.label}</span>
                                            {item.val && <span>{item.val}</span>}
                                        </div>
                                    }
                                    primaryTypographyProps={{ fontSize: "0.8rem", fontFamily: "monospace" }} 
                                />
                             </ListItemButton>
                        ))}
                    </List>
                  </Collapse>
                </List>
              </div>
            </div>

            {/* CENTER COLUMN: Expression Editor */}
            <div className="col-lg-6 d-flex flex-column">
               <div 
                 className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                   <div>
                       <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#E0E0E0" }}>Expression</Typography>
                       <Typography variant="caption" sx={{ color: "#9E9E9E" }}>
                           Anything inside <span>{"{{ }}"}</span> is JavaScript. <span style={{ textDecoration: "underline", cursor: "pointer", color: "#FF6F5C" }}>Learn more</span>
                       </Typography>
                   </div>
               </div>
               
               <div className="flex-grow-1 p-0 position-relative">
                  <textarea
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      className="w-100 h-100 bg-transparent border-0 font-monospace p-3 lh-base"
                      style={{
                          color: "#A78BFA",
                          fontSize: "14px",
                          resize: "none",
                          outline: "none",
                      }}
                      spellCheck={false}
                  />
               </div>
            </div>

            {/* RIGHT COLUMN: Result */}
            <div
              className="col-lg-3 border-start h-100 overflow-auto d-flex flex-column">
               <div 
                 className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                   <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#E0E0E0" }}>Result</Typography>
                   <IconButton size="small" onClick={onClose} sx={{ color: "#E0E0E0" }}>
                       <CloseIcon fontSize="small" />
                   </IconButton>
               </div>

               <div className="px-3 py-2 d-flex align-items-center justify-content-between border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <Typography variant="caption" sx={{ color: "#9E9E9E" }}>Item</Typography>
                        <div className="d-flex align-items-center bg-dark rounded px-1">
                            <Typography variant="caption" sx={{ px: 1, color: "#E0E0E0" }}>0</Typography>
                        </div>
                    </div>
                    
                    <ButtonGroup size="small" variant="outlined" sx={{ borderColor: "#444" }}>
                        <Button sx={{ color: "#E0E0E0", borderColor: "#444", fontSize: "0.65rem", py: 0, minWidth: 30, textTransform: "none", bgcolor: "#333" }}>Text</Button>
                        <Button sx={{ color: "#9E9E9E", borderColor: "#444", fontSize: "0.65rem", py: 0, minWidth: 30, textTransform: "none" }}>Html</Button>
                        <Button sx={{ color: "#9E9E9E", borderColor: "#444", fontSize: "0.65rem", py: 0, minWidth: 30, textTransform: "none" }}>Markdown</Button>
                    </ButtonGroup>
               </div>

               <div className="p-3 flex-grow-1 font-monospace">
                   <Typography variant="body2" sx={{ color: "#D1D5DB", fontSize: "0.85rem", fontFamily: "monospace" }}>
                       [Execute previous nodes for preview]
                   </Typography>
               </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FlowsExpressionModalComponent;
