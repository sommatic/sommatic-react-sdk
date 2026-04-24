import React, { useState, useCallback, useMemo } from 'react';
import { CodeEditor, TextEditor, serializeToMarkdown } from '@link-loom/react-sdk';
import { TextField, IconButton, Chip, Collapse, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const CategoryCard = styled.article`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
`;

const CategoryHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  &:hover {
    background: #f3f4f6;
  }
`;

const CategoryBody = styled.section`
  padding: 0 14px 14px;
  border-top: 1px solid #e5e7eb;
`;

const SubRow = styled.article`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  background: ${(props) => (props.$even ? '#ffffff' : '#fafbfc')};
  border: 1px solid ${(props) => (props.$showDesc ? '#d1d5db' : 'transparent')};
  margin-top: 2px;

  &:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }
`;

const SubIndex = styled.span`
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  user-select: none;
`;

const SummaryBar = styled.section`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const SummaryItem = styled.article`
  text-align: center;
  & .label {
    font-size: 0.7rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  & .value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
`;

const CompactInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.8rem;
  color: #1f2937;
  width: 100%;
  padding: 2px 4px;
  border-radius: 3px;

  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 1px #3a2e4f;
  }

  &::placeholder {
    color: #c4c9d1;
    font-style: italic;
  }
`;

function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = html.split('\n');
  const result = [];
  let inList = false;

  for (const line of lines) {
    if (/^- (.+)$/.test(line)) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(line.replace(/^- (.+)$/, '<li>$1</li>'));
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      if (line.startsWith('<h')) { result.push(line); }
      else if (line.trim() === '') { result.push(''); }
      else { result.push(`<p>${line}</p>`); }
    }
  }
  if (inList) result.push('</ul>');

  return result.join('');
}

function TaxonomyResourceEditor({ content = {}, onChange, ui = {} }) {
  const [viewMode, setViewMode] = useState('builder');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubDescriptions, setExpandedSubDescriptions] = useState({});
  const [modalEditor, setModalEditor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const categories = content?.structured_data?.categories || [];
  const totalSubcategories = categories.reduce((acc, cat) => acc + (cat?.subcategories?.length || 0), 0);

  const updateCategories = useCallback(
    (nextCategories) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...content,
        format: 'json',
        structured_data: {
          ...content?.structured_data,
          categories: nextCategories,
        },
      });
    },
    [content, onChange]
  );

  const toggleCategory = useCallback((index) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const toggleSubDescription = useCallback((catIndex, subIndex) => {
    const key = `${catIndex}-${subIndex}`;
    setExpandedSubDescriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const expandAllCategories = useCallback(() => {
    const all = {};
    categories.forEach((_, i) => {
      all[i] = true;
    });
    setExpandedCategories(all);
  }, [categories]);

  const collapseAllCategories = useCallback(() => {
    setExpandedCategories({});
  }, []);

  const handleCategoryChange = useCallback(
    (index, field, value) => {
      const next = categories.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat));
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const handleAddCategory = useCallback(() => {
    const next = [...categories, { name: '', description: '', subcategories: [] }];
    updateCategories(next);
    setExpandedCategories((prev) => ({ ...prev, [next.length - 1]: true }));
  }, [categories, updateCategories]);

  const handleRemoveCategory = useCallback(
    (index) => {
      updateCategories(categories.filter((_, i) => i !== index));
    },
    [categories, updateCategories]
  );

  const handleSubcategoryChange = useCallback(
    (catIndex, subIndex, field, value) => {
      const next = categories.map((cat, ci) => {
        if (ci !== catIndex) {
          return cat;
        }

        const nextSubs = (cat.subcategories || []).map((sub, si) => (si === subIndex ? { ...sub, [field]: value } : sub));

        return { ...cat, subcategories: nextSubs };
      });
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const handleAddSubcategory = useCallback(
    (catIndex) => {
      const next = categories.map((cat, ci) => {
        if (ci !== catIndex) {
          return cat;
        }

        return {
          ...cat,
          subcategories: [...(cat.subcategories || []), { name: '', description: '' }],
        };
      });
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const handleRemoveSubcategory = useCallback(
    (catIndex, subIndex) => {
      const next = categories.map((cat, ci) => {
        if (ci !== catIndex) {
          return cat;
        }

        return {
          ...cat,
          subcategories: (cat.subcategories || []).filter((_, si) => si !== subIndex),
        };
      });
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const handleJsonChange = useCallback(
    (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);

        onChange({
          ...content,
          format: 'json',
          structured_data: parsed,
        });
      } catch {
        // Invalid JSON
      }
    },
    [content, onChange]
  );

  const openDescriptionModal = useCallback((catIndex, subIndex = null) => {
    const category = categories[catIndex];
    if (!category) return;

    const isSubcategory = subIndex !== null;
    const target = isSubcategory ? (category.subcategories || [])[subIndex] : category;
    const name = isSubcategory
      ? target?.name || `Subcategory ${subIndex + 1}`
      : category.name || `Category ${catIndex + 1}`;

    const initialValue = target?.description || '';
    setModalEditor({
      catIndex,
      subIndex,
      name,
      value: initialValue,
      initialValue,
    });
  }, [categories]);

  const handleModalSave = useCallback(() => {
    if (!modalEditor) return;

    const { catIndex, subIndex, value } = modalEditor;

    if (subIndex !== null) {
      handleSubcategoryChange(catIndex, subIndex, 'description', value);
    } else {
      handleCategoryChange(catIndex, 'description', value);
    }

    setModalEditor(null);
    setConfirmDiscard(false);
  }, [modalEditor, handleCategoryChange, handleSubcategoryChange]);

  // Dirty-tracking + confirm-on-close so Esc/click-outside/Cancel can't
  // silently destroy work. Description edits can be hundreds of lines — a
  // misclick should not be catastrophic.
  const modalIsDirty = Boolean(
    modalEditor && modalEditor.value !== modalEditor.initialValue,
  );

  const handleModalClose = useCallback(() => {
    if (modalIsDirty) {
      setConfirmDiscard(true);
      return;
    }
    setModalEditor(null);
  }, [modalIsDirty]);

  const handleDiscardChanges = useCallback(() => {
    setModalEditor(null);
    setConfirmDiscard(false);
  }, []);

  const handleKeepEditing = useCallback(() => {
    setConfirmDiscard(false);
  }, []);

  // Initial HTML computed only when the edit session starts (i.e. catIndex /
  // subIndex changes). The modal uses `key` to re-mount on new sessions,
  // which is the trigger for recomputing this value.
  const modalInitialHtml = useMemo(() => {
    if (!modalEditor) return '';
    return encodeURIComponent(markdownToHtml(modalEditor.initialValue || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalEditor?.catIndex, modalEditor?.subIndex]);

  const modalSessionKey = modalEditor
    ? `${modalEditor.catIndex}::${modalEditor.subIndex ?? 'root'}`
    : null;

  const anyExpanded = Object.values(expandedCategories).some(Boolean);

  return (
    <EditorContainer>
      <header className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0" style={{ color: '#374151', fontWeight: 600 }}>
          {ui?.title || 'Taxonomy Builder'}
        </h6>
        <section className="d-flex gap-2 align-items-center">
          {viewMode === 'builder' && categories.length > 1 && (
            <Tooltip title={anyExpanded ? 'Collapse all' : 'Expand all'} arrow>
              <IconButton
                size="small"
                onClick={anyExpanded ? collapseAllCategories : expandAllCategories}
                sx={{ padding: '3px', color: '#6B7280' }}
              >
                {anyExpanded ? <UnfoldLessIcon sx={{ fontSize: 18 }} /> : <UnfoldMoreIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          )}
          <Chip
            label="Builder"
            size="small"
            variant={viewMode === 'builder' ? 'filled' : 'outlined'}
            onClick={() => setViewMode('builder')}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Structured JSON"
            size="small"
            variant={viewMode === 'json' ? 'filled' : 'outlined'}
            onClick={() => setViewMode('json')}
            sx={{ cursor: 'pointer' }}
          />
        </section>
      </header>

      <SummaryBar>
        <SummaryItem>
          <div className="value">{categories.length}</div>
          <div className="label">Categories</div>
        </SummaryItem>
        <SummaryItem>
          <div className="value">{totalSubcategories}</div>
          <div className="label">Subcategories</div>
        </SummaryItem>
      </SummaryBar>

      {viewMode === 'builder' ? (
        <section>
          {categories.map((category, catIndex) => (
            <CategoryCard key={catIndex}>
              <CategoryHeader onClick={() => toggleCategory(catIndex)}>
                <section className="d-flex align-items-center gap-2">
                  {expandedCategories[catIndex] ? (
                    <ExpandLessIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                  )}
                  <span style={{ fontWeight: 500, color: '#1F2937', fontSize: '0.85rem' }}>
                    {category.name || 'Unnamed category'}
                  </span>
                  <Chip
                    label={`${(category.subcategories || []).length} sub`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </section>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ type: 'category', catIndex, name: category.name || `Category ${catIndex + 1}` });
                  }}
                  title="Remove category"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16, color: '#FB7185' }} />
                </IconButton>
              </CategoryHeader>

              <Collapse in={expandedCategories[catIndex]}>
                <CategoryBody>
                  <div className="row g-2 mt-2">
                    <div className="col-12">
                      <TextField
                        label="Category name"
                        value={category.name || ''}
                        onChange={(e) => handleCategoryChange(catIndex, 'name', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="e.g. Fruits & Vegetables"
                        helperText="A unique name to identify this category within the taxonomy"
                        FormHelperTextProps={{ sx: { fontSize: '0.7rem', color: '#9CA3AF' } }}
                      />
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Description</span>
                        <Tooltip title="Expand editor" arrow>
                          <IconButton
                            size="small"
                            onClick={() => openDescriptionModal(catIndex)}
                            sx={{ padding: '2px', color: '#6B7280' }}
                          >
                            <OpenInFullIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </div>
                      <section style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', minHeight: 60 }}>
                        <TextEditor
                          key={`cat-desc-${catIndex}`}
                          id={`cat-desc-${catIndex}`}
                          modelraw={encodeURIComponent(markdownToHtml(category.description || ''))}
                          outputFormat="markdown"
                          syncMode="uncontrolled"
                          onModelChange={({ model }) => {
                            const newValue = decodeURIComponent(model);
                            if (newValue !== (category.description || '')) {
                              handleCategoryChange(catIndex, 'description', newValue);
                            }
                          }}
                          minRows={2}
                          maxRows={10}
                          toolbarOptions={[
                            'heading',
                            'bold',
                            'italic',
                            'underline',
                            'strike',
                            'code',
                            'list',
                            'blockquote',
                            'codeBlock',
                          ]}
                        />
                      </section>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginTop: 4 }}>
                        Optional context for AI agents and operators
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3 mb-1">
                    <h6 className="mb-0" style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                      Subcategories
                      <span style={{ fontWeight: 400, marginLeft: 4, color: '#9CA3AF' }}>
                        ({(category.subcategories || []).length})
                      </span>
                    </h6>
                  </div>

                  {(category.subcategories || []).length === 0 && (
                    <p className="text-muted small fst-italic m-0 py-2" style={{ fontSize: '0.75rem' }}>
                      No subcategories yet. Add one below.
                    </p>
                  )}

                  {(category.subcategories || []).map((sub, subIndex) => {
                    const descKey = `${catIndex}-${subIndex}`;
                    const showDesc = expandedSubDescriptions[descKey];

                    return (
                      <React.Fragment key={subIndex}>
                        <SubRow $even={subIndex % 2 === 0} $showDesc={showDesc}>
                          <SubIndex>{subIndex + 1}</SubIndex>
                          <CompactInput
                            value={sub.name || ''}
                            onChange={(e) => handleSubcategoryChange(catIndex, subIndex, 'name', e.target.value)}
                            placeholder="Subcategory name..."
                          />
                          <Tooltip title={showDesc ? 'Hide description' : 'Add description'} arrow>
                            <IconButton
                              size="small"
                              onClick={() => toggleSubDescription(catIndex, subIndex)}
                              sx={{
                                padding: '2px',
                                color: sub.description ? '#3A2E4F' : '#C4C9D1',
                              }}
                            >
                              <NotesOutlinedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Expand editor" arrow>
                            <IconButton
                              size="small"
                              onClick={() => openDescriptionModal(catIndex, subIndex)}
                              sx={{ padding: '2px', color: '#6B7280' }}
                            >
                              <OpenInFullIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm({ type: 'subcategory', catIndex, subIndex, name: sub.name || `Subcategory ${subIndex + 1}` })}
                            sx={{ padding: '2px' }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 14, color: '#FB7185' }} />
                          </IconButton>
                        </SubRow>
                        {showDesc && (
                          <div style={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 6, background: subIndex % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                            <section style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>
                              <TextEditor
                                key={`sub-desc-${catIndex}-${subIndex}`}
                                id={`sub-desc-${catIndex}-${subIndex}`}
                                modelraw={encodeURIComponent(markdownToHtml(sub.description || ''))}
                                outputFormat="markdown"
                                syncMode="uncontrolled"
                                onModelChange={({ model }) => {
                                  const newValue = decodeURIComponent(model);
                                  if (newValue !== (sub.description || '')) {
                                    handleSubcategoryChange(catIndex, subIndex, 'description', newValue);
                                  }
                                }}
                                minRows={3}
                                maxRows={10}
                                toolbarOptions={[
                                  'heading',
                                  'bold',
                                  'italic',
                                  'underline',
                                  'strike',
                                  'code',
                                  'list',
                                  'blockquote',
                                  'codeBlock',
                                ]}
                              />
                            </section>
                            <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'block', marginTop: 4 }}>
                              Provide comprehensive context — AI agents and operators rely on this to classify and interpret correctly
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  <button
                    className="btn btn-sm mt-2"
                    style={{ color: '#3A2E4F', border: '1px dashed #D1D5DB', fontSize: '0.75rem', padding: '3px 10px' }}
                    onClick={() => handleAddSubcategory(catIndex)}
                  >
                    <AddIcon sx={{ fontSize: 14, marginRight: 0.5 }} /> Add subcategory
                  </button>
                </CategoryBody>
              </Collapse>
            </CategoryCard>
          ))}

          <button
            className="btn btn-sm mt-2"
            style={{ color: '#3A2E4F', border: '1px dashed #3A2E4F' }}
            onClick={handleAddCategory}
          >
            <AddIcon sx={{ fontSize: 16, marginRight: 0.5 }} /> Add category
          </button>
        </section>
      ) : (
        <CodeEditor
          language="json"
          defaultValue={JSON.stringify(content?.structured_data || { categories: [] }, null, 2)}
          theme="vs-light"
          height="400px"
          onChange={handleJsonChange}
        />
      )}
      {modalEditor && (
        <Dialog
          open={true}
          onClose={handleModalClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Edit Description — {modalEditor.name}
              {modalIsDirty && (
                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#B45309', fontWeight: 500 }}>
                  • unsaved
                </span>
              )}
            </span>
            <IconButton size="small" onClick={handleModalClose}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextEditor
              key={modalSessionKey}
              id="taxonomy-description-editor"
              modelraw={modalInitialHtml}
              outputFormat="markdown"
              syncMode="uncontrolled"
              focusPosition="start"
              onModelChange={({ model }) => {
                setModalEditor((prev) =>
                  prev ? { ...prev, value: decodeURIComponent(model) } : prev,
                );
              }}
              autoFocus={true}
              minRows={10}
              maxRows={22}
              toolbarOptions={[
                'undo',
                'heading',
                'bold',
                'italic',
                'underline',
                'strike',
                'code',
                'blockquote',
                'codeBlock',
                'list',
                'align',
                'superscript',
                'subscript',
              ]}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button
              onClick={handleModalClose}
              size="small"
              sx={{ textTransform: 'none', color: '#6B7280' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModalSave}
              variant="contained"
              size="small"
              disabled={!modalIsDirty}
              sx={{
                textTransform: 'none',
                backgroundColor: '#3A2E4F',
                '&:hover': { backgroundColor: '#2D243E' },
              }}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {confirmDiscard && (
        <Dialog
          open={true}
          onClose={handleKeepEditing}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
            <WarningAmberIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Discard changes?
            </span>
          </DialogTitle>
          <DialogContent>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0 }}>
              You have unsaved changes in this description. Closing now will lose them.
            </p>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button
              onClick={handleKeepEditing}
              size="small"
              sx={{ textTransform: 'none', color: '#6B7280' }}
            >
              Keep editing
            </Button>
            <Button
              onClick={handleDiscardChanges}
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                backgroundColor: '#9F1239',
                '&:hover': { backgroundColor: '#7F0F2E' },
              }}
            >
              Discard
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {deleteConfirm && (
        <Dialog
          open={true}
          onClose={() => setDeleteConfirm(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
            <WarningAmberIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Delete {deleteConfirm.type === 'category' ? 'Category' : 'Subcategory'}
            </span>
          </DialogTitle>
          <DialogContent>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button
              onClick={() => setDeleteConfirm(null)}
              size="small"
              sx={{ textTransform: 'none', color: '#6B7280' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirm.type === 'category') {
                  handleRemoveCategory(deleteConfirm.catIndex);
                } else {
                  handleRemoveSubcategory(deleteConfirm.catIndex, deleteConfirm.subIndex);
                }
                setDeleteConfirm(null);
              }}
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                backgroundColor: '#9F1239',
                '&:hover': { backgroundColor: '#7F0F2E' },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </EditorContainer>
  );
}

export default TaxonomyResourceEditor;
