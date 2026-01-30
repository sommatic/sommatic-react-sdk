import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    IconButton
} from '@mui/material';
import {
    Restore as RestoreIcon,
    Close as CloseIcon
} from '@mui/icons-material';

/**
 * Modal to display full history of flow versions and allow restoration.
 * @param {boolean} open
 * @param {function} onClose
 * @param {Array} versions - List of WorkflowFlowVersionModel
 * @param {function} onRestore - Callback(version)
 */
function FlowVersionsHistoryModalComponent({ open, onClose, versions = [], onRestore }) {

    const formatDate = (dateString) => {
        if (!dateString) return "-";

        // Try parsing
        let date = new Date(dateString);
        // If invalid, try casting to number (timestamp string)
        if (isNaN(date.getTime())) {
            date = new Date(+dateString);
        }

        if (isNaN(date.getTime())) return "Invalid Date";

        return date.toLocaleString();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#1E1E1E',
                    color: '#E0E0E0',
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <Typography variant="h6" component="div">Version History</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: '#9E9E9E' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#252525', color: '#9E9E9E', borderBottom: '1px solid #333' }}>Version</TableCell>
                                <TableCell sx={{ bgcolor: '#252525', color: '#9E9E9E', borderBottom: '1px solid #333' }}>Published Date</TableCell>
                                <TableCell sx={{ bgcolor: '#252525', color: '#9E9E9E', borderBottom: '1px solid #333' }}>Description</TableCell>
                                <TableCell sx={{ bgcolor: '#252525', color: '#9E9E9E', borderBottom: '1px solid #333' }} align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {versions.length > 0 ? (
                                versions.map((version) => (
                                    <TableRow
                                        key={version.id}
                                        sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
                                    >
                                        <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid #333' }}>
                                            <Chip
                                                label={`v${version.version}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(124, 58, 237, 0.2)',
                                                    color: '#A78BFA',
                                                    fontWeight: 'bold',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid #333' }}>
                                            {formatDate(version.created?.timestamp || version.created)}
                                        </TableCell>
                                        <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #333' }}>
                                            {version.description || <em>No description</em>}
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottom: '1px solid #333' }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<RestoreIcon />}
                                                onClick={() => {
                                                    onRestore(version);
                                                    onClose();
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#E0E0E0',
                                                    borderColor: '#555',
                                                    '&:hover': {
                                                        borderColor: '#A78BFA',
                                                        bgcolor: 'rgba(167, 139, 250, 0.08)'
                                                    }
                                                }}
                                            >
                                                Restore
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#666', borderBottom: 'none' }}>
                                        No versions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
}

export default FlowVersionsHistoryModalComponent;
