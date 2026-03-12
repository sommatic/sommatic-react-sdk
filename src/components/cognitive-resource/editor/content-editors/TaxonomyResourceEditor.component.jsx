import React, { useState, useCallback } from 'react';
import { CodeEditor } from '@link-loom/react-sdk';
import { TextField, IconButton, Chip, Collapse, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
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

function TaxonomyResourceEditor({ content = {}, onChange, ui = {} }) {
  const [viewMode, setViewMode] = useState('builder');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubDescriptions, setExpandedSubDescriptions] = useState({});

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
                    handleRemoveCategory(catIndex);
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
                      <TextField
                        label="Description"
                        value={category.description || ''}
                        onChange={(e) => handleCategoryChange(catIndex, 'description', e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        placeholder="Describe what this category covers and its scope within the taxonomy..."
                        helperText="Optional context for AI agents and operators"
                        FormHelperTextProps={{ sx: { fontSize: '0.7rem', color: '#9CA3AF' } }}
                      />
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
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveSubcategory(catIndex, subIndex)}
                            sx={{ padding: '2px' }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 14, color: '#FB7185' }} />
                          </IconButton>
                        </SubRow>
                        {showDesc && (
                          <div style={{ paddingLeft: 28, paddingRight: 32, paddingBottom: 6, background: subIndex % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                            <TextField
                              value={sub.description || ''}
                              onChange={(e) => handleSubcategoryChange(catIndex, subIndex, 'description', e.target.value)}
                              size="small"
                              fullWidth
                              multiline
                              minRows={3}
                              maxRows={10}
                              placeholder="Detailed description of this subcategory, including scope, criteria, applicable regulations or policies..."
                              helperText="Provide comprehensive context — AI agents and operators rely on this to classify and interpret correctly"
                              FormHelperTextProps={{ sx: { fontSize: '0.65rem', color: '#9CA3AF' } }}
                              sx={{
                                mt: 0.5,
                                '& .MuiOutlinedInput-root': { fontSize: '0.78rem' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                              }}
                            />
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
    </EditorContainer>
  );
}

export default TaxonomyResourceEditor;
