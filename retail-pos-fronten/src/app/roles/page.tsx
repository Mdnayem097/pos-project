"use client";

import React, { useEffect, useState } from "react";
import {
  createRole,
  deleteRole,
  fetchRoleModules,
  fetchRoles,
  updateRole,
} from "@/lib/api";
import type { ModuleDefinition, Role } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CheckSquare,
  Key,
  Loader2,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
  Users,
  X,
} from "lucide-react";

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Permission checks
  const canCreate = hasPermission("roles:create");
  const canUpdate = hasPermission("roles:update");
  const canDelete = hasPermission("roles:delete");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, modulesData] = await Promise.all([
        fetchRoles(),
        fetchRoleModules(),
      ]);
      setRoles(rolesData);
      setModules(modulesData);
    } catch (err: any) {
      setError(err.message || "Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setSelectedPermissions([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    setSelectedPermissions([...(role.permissions || [])]);
    setModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const isModuleAllSelected = (mod: ModuleDefinition) => {
    return mod.actions.every((a) =>
      selectedPermissions.includes(`${mod.module}:${a.key}`)
    );
  };

  const toggleModuleAll = (mod: ModuleDefinition) => {
    const allModulePerms = mod.actions.map((a) => `${mod.module}:${a.key}`);
    const allSelected = isModuleAllSelected(mod);

    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !allModulePerms.includes(p))
      );
    } else {
      setSelectedPermissions((prev) =>
        Array.from(new Set([...prev, ...allModulePerms]))
      );
    }
  };

  const totalPossiblePermissions = modules.reduce(
    (sum, m) => sum + m.actions.length,
    0
  );

  const toggleMasterAll = () => {
    const allPerms = modules.flatMap((m) =>
      m.actions.map((a) => `${m.module}:${a.key}`)
    );
    if (selectedPermissions.length === allPerms.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPerms);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification("error", "Role name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          permissions: selectedPermissions,
        });
        showNotification("success", `Role '${formName}' updated successfully`);
      } else {
        await createRole({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          permissions: selectedPermissions,
        });
        showNotification("success", `Role '${formName}' created successfully`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      showNotification("error", "System roles cannot be deleted");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete role '${role.name}'? Users assigned to this role will lose their custom privileges.`
      )
    ) {
      return;
    }

    try {
      await deleteRole(role.id);
      showNotification("success", `Role '${role.name}' deleted`);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-sm font-medium shadow-sm transition ${
            notification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="text-red-500" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 dark:text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                Roles & Permissions
              </h1>
              <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
                Define custom roles and assign module-wise access control
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Role</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-stone-200 dark:border-[#1F293D] bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-2.5 text-sm text-stone-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span>Loading roles & system modules...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <AlertCircle size={32} className="text-red-500 mb-2" />
          <p className="font-bold">Error loading roles</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const isSuper = role.slug === "super_admin";
            const permsCount = role.permissions?.length || 0;

            return (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-5 shadow-sm transition hover:border-[#fae5d7] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span>{role.name}</span>
                        {isSuper && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                            <ShieldCheck size={12} />
                            Master
                          </span>
                        )}
                        {!isSuper && role.isSystem && (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 dark:bg-[#162035] px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-slate-400">
                            <Lock size={10} />
                            System
                          </span>
                        )}
                      </h3>
                      <p className="mt-0.5 text-xs text-stone-400 font-mono">
                        {role.slug}
                      </p>
                    </div>

                    <span className="rounded-full bg-stone-100 dark:bg-[#162035] px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-slate-400">
                      {isSuper ? "All" : `${permsCount} / ${totalPossiblePermissions}`} perms
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-stone-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {role.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-5 border-t border-stone-100 dark:border-[#1F293D] pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {role.isSystem ? "Built-in Role" : "Custom Role"}
                  </span>

                  <div className="flex items-center gap-2">
                    {canUpdate && !isSuper && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(role)}
                        className="rounded-lg border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition"
                      >
                        Edit Grid
                      </button>
                    )}

                    {canDelete && !role.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        className="rounded-lg p-1 text-stone-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Role"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Role Modal with Checkbox Grid */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-4 sm:my-8 w-full max-w-3xl rounded-2xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#111827] p-4 sm:p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#1F293D] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Shield size={19} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Role"}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Check the boxes below to grant specific module operations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="mt-4 space-y-4">
              {/* Form Inputs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-400 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Shift Supervisor"
                    required
                    disabled={editingRole?.isSystem}
                    className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/50 dark:bg-[#162035]/50 px-3.5 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of role responsibilities"
                    className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/50 dark:bg-[#162035]/50 px-3.5 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                  />
                </div>
              </div>

              {/* Module Checkbox Grid Header */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                  Module Permissions Grid ({selectedPermissions.length} selected)
                </span>
                <button
                  type="button"
                  onClick={toggleMasterAll}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {selectedPermissions.length === totalPossiblePermissions
                    ? "Deselect All"
                    : "Select All Permissions"}
                </button>
              </div>

              {/* Mobile Module Cards (Zero Horizontal Scroll) */}
              <div className="block sm:hidden rounded-xl border border-stone-200 dark:border-[#1F293D] max-h-[360px] overflow-y-auto divide-y divide-stone-100 dark:divide-[#1F293D] bg-white dark:bg-[#111827]">
                {modules.map((mod) => {
                  const allSelected = isModuleAllSelected(mod);
                  return (
                    <div key={mod.module} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-stone-900 dark:text-white">{mod.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleModuleAll(mod)}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded transition ${
                            allSelected
                              ? "bg-brand-100 text-brand-700 font-bold"
                              : "bg-stone-100 dark:bg-[#162035] text-stone-600 dark:text-slate-400 hover:bg-stone-200"
                          }`}
                        >
                          {allSelected ? "All ✓" : "Select All"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {mod.actions.map((act) => {
                          const pKey = `${mod.module}:${act.key}`;
                          const isChecked = selectedPermissions.includes(pKey);
                          return (
                            <button
                              key={act.key}
                              type="button"
                              onClick={() => togglePermission(pKey)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                                isChecked
                                  ? "bg-brand-500 border-brand-500 text-white shadow-xs"
                                  : "bg-stone-50 dark:bg-[#162035] border-stone-200 dark:border-[#1F293D] text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:bg-[#162035]"
                              }`}
                            >
                              <span className="text-[10px]">{isChecked ? "✓" : "+"}</span>
                              <span className="capitalize">{act.key}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Checkbox Grid Table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-stone-200 dark:border-[#1F293D] max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-stone-50 dark:bg-[#162035] text-stone-600 dark:text-slate-400 font-semibold border-b border-stone-200 dark:border-[#1F293D] z-10">
                    <tr>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3 text-center">View</th>
                      <th className="py-2.5 px-3 text-center">Create</th>
                      <th className="py-2.5 px-3 text-center">Update</th>
                      <th className="py-2.5 px-3 text-center">Delete</th>
                      <th className="py-2.5 px-3 text-center">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-[#1F293D] bg-white dark:bg-[#111827]">
                    {modules.map((mod) => {
                      const allSelected = isModuleAllSelected(mod);
                      const hasView = mod.actions.some((a) => a.key === "view" || a.key === "access");
                      const hasCreate = mod.actions.some((a) => a.key === "create");
                      const hasUpdate = mod.actions.some((a) => a.key === "update");
                      const hasDelete = mod.actions.some((a) => a.key === "delete");

                      const viewKey = `${mod.module}:${mod.actions.find((a) => a.key === "view" || a.key === "access")?.key}`;
                      const createKey = `${mod.module}:create`;
                      const updateKey = `${mod.module}:update`;
                      const deleteKey = `${mod.module}:delete`;

                      return (
                        <tr key={mod.module} className="hover:bg-stone-50 dark:bg-[#162035]/70 dark:bg-[#162035]/70">
                          <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-white">
                            {mod.label}
                          </td>

                          {/* View */}
                          <td className="py-2.5 px-3 text-center">
                            {hasView ? (
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(viewKey)}
                                onChange={() => togglePermission(viewKey)}
                                className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* Create */}
                          <td className="py-2.5 px-3 text-center">
                            {hasCreate ? (
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(createKey)}
                                onChange={() => togglePermission(createKey)}
                                className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* Update */}
                          <td className="py-2.5 px-3 text-center">
                            {hasUpdate ? (
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(updateKey)}
                                onChange={() => togglePermission(updateKey)}
                                className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="py-2.5 px-3 text-center">
                            {hasDelete ? (
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(deleteKey)}
                                onChange={() => togglePermission(deleteKey)}
                                className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* All Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => toggleModuleAll(mod)}
                              className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                              title="Toggle all for this module"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-[#1F293D]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-stone-200 dark:border-[#1F293D] px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:bg-[#162035]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Role</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
