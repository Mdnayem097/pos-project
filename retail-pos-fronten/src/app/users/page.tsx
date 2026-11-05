"use client";

import React, { useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  fetchRoles,
  fetchUsers,
  updateUser,
} from "@/lib/api";
import type { AdminUser, Role } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Permission checks
  const canCreate = hasPermission("users:create");
  const canUpdate = hasPermission("users:update");
  const canDelete = hasPermission("users:delete");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0 && formRoleId === 0) {
        setFormRoleId(rolesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
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

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pass);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    generateRandomPassword();
    setFormRoleId(roles[0]?.id || 1);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (u: AdminUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword("");
    setFormRoleId(u.roleId || roles[0]?.id || 1);
    setFormIsActive(u.isActive);
    setModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showNotification("error", "Name and Email are required");
      return;
    }

    try {
      setSaving(true);
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          roleId: formRoleId,
          isActive: formIsActive,
          password: formPassword.trim() ? formPassword.trim() : undefined,
          mustChangePassword: formPassword.trim() ? true : undefined,
        });
        showNotification("success", `User '${formName}' updated successfully`);
      } else {
        if (!formPassword.trim()) {
          showNotification("error", "Temporary password is required for new users");
          setSaving(false);
          return;
        }
        await createUser({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          roleId: formRoleId,
        });
        showNotification(
          "success",
          `User '${formName}' created! They will be prompted to change password on first login.`
        );
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (u.isSuperAdmin) {
      showNotification("error", "Super Admin cannot be deleted");
      return;
    }
    if (u.id === currentUser?.id) {
      showNotification("error", "You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete user '${u.name}'?`)) {
      return;
    }

    try {
      await deleteUser(u.id);
      showNotification("success", `User '${u.name}' has been deleted`);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete user");
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
            className="text-stone-400 hover:text-stone-600"
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
              <Users size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                Admin Users
              </h1>
              <p className="text-xs font-medium text-stone-500">
                Manage staff accounts, assign roles, and issue temporary credentials
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
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2.5 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span>Loading users...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <AlertCircle size={32} className="text-red-500 mb-2" />
          <p className="font-bold">Error loading users</p>
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
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Password Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => {
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const roleName = u.roleEntity?.name || u.role;

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                            {initials}
                          </span>
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.isSuperAdmin && (
                                <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
                                  <ShieldCheck size={11} />
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 capitalize">
                          {roleName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Password Status */}
                      <td className="py-3.5 px-4">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                            <KeyRound size={12} className="text-amber-600" />
                            Must Change on 1st Login
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Password Set
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && !u.isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}

                          {u.isSuperAdmin && (
                            <span
                              className="p-1.5 text-stone-300 cursor-not-allowed"
                              title="Super Admin cannot be deleted"
                            >
                              <Lock size={15} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#fae5d7] bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UserPlus size={19} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {editingUser ? `Edit User: ${editingUser.name}` : "Create New Admin User"}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {editingUser
                      ? "Update staff profile, role, or reset password"
                      : "New staff will be required to change password on first login"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="staff@retailpos.com"
                  required
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </div>

              {/* Temporary Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    {editingUser ? "Reset Password (leave empty to keep current)" : "Temporary Password *"}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    <RefreshCw size={11} />
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Temporary password"}
                  required={!editingUser}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 font-mono text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
                {!editingUser && (
                  <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                    ⚠️ The user must change this temporary password immediately upon their first login.
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(Number(e.target.value))}
                  disabled={editingUser?.isSuperAdmin}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </option>
                  ))}
                </select>
                {editingUser?.isSuperAdmin && (
                  <p className="mt-1 text-[11px] text-stone-400">
                    Super Admin role cannot be changed.
                  </p>
                )}
              </div>

              {/* Active Toggle */}
              {editingUser && !editingUser.isSuperAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-stone-700 cursor-pointer">
                    Account is active and allowed to login
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
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
                    <span>{editingUser ? "Update User" : "Create User"}</span>
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
