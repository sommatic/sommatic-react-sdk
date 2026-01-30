import React from 'react';
import {
  Dialog,
  DialogContent,
  Button
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import NodeConfigLeftPanelComponent from './node-config/NodeConfigLeftPanel.component';
import NodeConfigCenterPanelComponent from './node-config/NodeConfigCenterPanel.component';
import NodeConfigRightPanelComponent from './node-config/NodeConfigRightPanel.component';

function FlowsNodeConfigModalComponent({ open, onClose, node, onSave }) {
  const [currentNodeData, setCurrentNodeData] = React.useState(null);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (node) {
      setCurrentNodeData(node.data ? { ...node.data } : {});
      setIsDirty(false);
    }
  }, [node]);

  if (!node || !currentNodeData) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(currentNodeData);
      setIsDirty(false); // Reset dirty after save
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setCurrentNodeData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: '#2B2B2B',
          backgroundImage: 'none',
          color: '#E0E0E0',
          width: '90vw',
          height: '100vh',
          maxWidth: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      {/* Top Header Global */}
      <div className="d-flex align-items-center justify-content-between px-3" style={{ height: '48px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#212121' }}>
        <Button
          startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
          onClick={handleClose}
          sx={{
            color: '#E0E0E0',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
          }}
        >
          Back to canvas
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            bgcolor: '#FF6F5C',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            '&:hover': { bgcolor: '#E05D4E' }
          }}
        >
          Save Changes
        </Button>
      </div>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="container-fluid flex-grow-1 p-0 h-100 overflow-hidden">
          <div className="row g-0 h-100">

            {/* LEFT PANEL: INPUT */}
            <NodeConfigLeftPanelComponent
              data={currentNodeData}
              onChange={handleChange}
            />

            {/* CENTER PANEL: CONFIGURATION */}
            <NodeConfigCenterPanelComponent
              node={{ ...node, data: currentNodeData }} // Merge for display compatibility
              data={currentNodeData}
              onChange={handleChange}
            />

            {/* RIGHT PANEL: OUTPUT */}
            <NodeConfigRightPanelComponent
              data={currentNodeData}
              onChange={handleChange}
            />

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FlowsNodeConfigModalComponent;
