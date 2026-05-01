import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { Folder as FolderIcon } from "@mui/icons-material";
import { fetchEntityCollection } from "../../../services/utils/entityServiceAdapter";
import { ProjectManagementService } from "../../../services/index";

// Resolves a project icon by name from @mui/icons-material at module load.
// Falls back to FolderIcon when the name is missing or unknown.
const resolveMuiIcon = (iconName) => {
  if (!iconName || typeof iconName !== "string") return null;
  const Icon = MuiIcons[iconName];
  return Icon || null;
};

// Mirrors the LlmProviderPicker pattern: scoped to the active organization,
// fetched with the same `organization-id` queryselector that
// `/client/project/management` uses, and emits both the id and the full
// project so callers can persist a visual snapshot under `context.project`.
const ProjectPickerComponent = ({
  organizationId,
  identity,
  value,
  valueSnapshot,
  onChange,
  disabled,
}) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setProjects([]);
      return undefined;
    }

    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetchEntityCollection({
          service: ProjectManagementService,
          payload: {
            queryselector: "organization-id",
            search: organizationId,
            identity,
            exclude_status: "deleted",
            page: 1,
            pageSize: 250,
          },
        });
        if (cancelled) return;
        const items = response?.result?.items || [];
        setProjects(items);
      } catch (err) {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [organizationId, identity]);

  const selectedProject = useMemo(() => {
    if (!value) return null;
    const fromList = projects.find((p) => p.id === value);
    if (fromList) return fromList;
    if (valueSnapshot && valueSnapshot.id === value) return valueSnapshot;
    if (valueSnapshot) {
      return { id: value, ...valueSnapshot };
    }
    return { id: value };
  }, [projects, value, valueSnapshot]);

  const renderProjectIcon = (project, size = 16) => {
    const emoji = project?.ui?.emoji;
    const ResolvedIcon = resolveMuiIcon(emoji?.icon);
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 0.75,
          backgroundColor: "#F3F4F6",
          flexShrink: 0,
        }}
      >
        {ResolvedIcon ? (
          <ResolvedIcon
            sx={{ fontSize: size, color: emoji?.color || "#6B7280" }}
          />
        ) : (
          <FolderIcon sx={{ fontSize: size, color: "#9CA3AF" }} />
        )}
      </Box>
    );
  };

  return (
    <Autocomplete
      size="small"
      fullWidth
      loading={isLoading}
      disabled={disabled}
      options={projects}
      value={selectedProject}
      onChange={(_, next) => onChange?.(next?.id || null, next || null)}
      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
      getOptionLabel={(opt) => {
        if (!opt) return "";
        return opt.name
          ? `${opt.name} (${opt.slug || opt.id})`
          : opt.slug || opt.id || "";
      }}
      renderOption={(props, opt) => (
        <Box
          component="li"
          {...props}
          key={opt.id}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          {renderProjectIcon(opt, 16)}
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {opt.name || opt.slug}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "monospace" }}
              noWrap
            >
              {opt.slug || opt.id}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Project"
          placeholder="Select a project"
          InputProps={{
            ...params.InputProps,
            startAdornment: selectedProject ? (
              <Box sx={{ ml: 0.5, mr: 0.5, display: "flex" }}>
                {renderProjectIcon(selectedProject, 14)}
              </Box>
            ) : (
              params.InputProps?.startAdornment
            ),
          }}
        />
      )}
    />
  );
};

export default ProjectPickerComponent;
