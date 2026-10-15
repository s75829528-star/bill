// ── Mock data & types for the Settings & Administration module ────
// No backend. Everything here is local, realistic mock data used to
// power the Settings UI. Nothing persists beyond the session.

// ── Users ────────────────────────────────────────────────────────

export type UserRole = "Owner" | "Admin" | "Manager" | "Sales" | "Inventory" | "Accountant" | "Viewer";
export type UserStatus = "active" | "invited" | "deactivated";

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string; // ISO date, or "" if never
  avatarColor: string;
}

export const teamUsers: TeamUser[] = [
  { id: "u1", name: "Aarav Sharma", email: "aarav@nexora.app", role: "Owner", status: "active", lastLogin: "2026-07-14T09:12:00", avatarColor: "bg-blue-500" },
  { id: "u2", name: "Priya Nair", email: "priya@nexora.app", role: "Admin", status: "active", lastLogin: "2026-07-13T18:45:00", avatarColor: "bg-violet-500" },
  { id: "u3", name: "Rohan Mehta", email: "rohan@nexora.app", role: "Manager", status: "active", lastLogin: "2026-07-14T07:30:00", avatarColor: "bg-emerald-500" },
  { id: "u4", name: "Sneha Iyer", email: "sneha@nexora.app", role: "Sales", status: "active", lastLogin: "2026-07-12T14:02:00", avatarColor: "bg-amber-500" },
  { id: "u5", name: "Karan Patel", email: "karan@nexora.app", role: "Inventory", status: "invited", lastLogin: "", avatarColor: "bg-cyan-500" },
  { id: "u6", name: "Divya Reddy", email: "divya@nexora.app", role: "Accountant", status: "active", lastLogin: "2026-07-11T11:20:00", avatarColor: "bg-pink-500" },
  { id: "u7", name: "Vikram Singh", email: "vikram@nexora.app", role: "Viewer", status: "deactivated", lastLogin: "2026-06-28T16:10:00", avatarColor: "bg-slate-400" },
];

// ── Roles & permissions ──────────────────────────────────────────

export const roleNames: UserRole[] = ["Owner", "Admin", "Manager", "Sales", "Inventory", "Accountant", "Viewer"];

export const permissionModules = ["Billing", "Inventory", "CRM", "Finance", "Reports", "Settings"] as const;
export type PermissionModule = (typeof permissionModules)[number];

export type PermissionLevel = "full" | "edit" | "view" | "none";

export const defaultPermissionMatrix: Record<UserRole, Record<PermissionModule, PermissionLevel>> = {
  Owner: { Billing: "full", Inventory: "full", CRM: "full", Finance: "full", Reports: "full", Settings: "full" },
  Admin: { Billing: "full", Inventory: "full", CRM: "full", Finance: "edit", Reports: "full", Settings: "edit" },
  Manager: { Billing: "edit", Inventory: "edit", CRM: "edit", Finance: "view", Reports: "view", Settings: "none" },
  Sales: { Billing: "edit", Inventory: "view", CRM: "full", Finance: "none", Reports: "view", Settings: "none" },
  Inventory: { Billing: "none", Inventory: "full", CRM: "none", Finance: "none", Reports: "view", Settings: "none" },
  Accountant: { Billing: "view", Inventory: "view", CRM: "none", Finance: "full", Reports: "full", Settings: "none" },
  Viewer: { Billing: "view", Inventory: "view", CRM: "view", Finance: "view", Reports: "view", Settings: "none" },
};

// ── Login activity ───────────────────────────────────────────────

export interface LoginActivityEntry {
  id: string;
  user: string;
  device: string;
  location: string;
  ip: string;
  time: string; // ISO
  current?: boolean;
}

export const loginActivity: LoginActivityEntry[] = [
  { id: "l1", user: "Aarav Sharma", device: "Chrome · macOS", location: "Mumbai, IN", ip: "103.21.244.12", time: "2026-07-14T09:12:00", current: true },
  { id: "l2", user: "Priya Nair", device: "Safari · iOS", location: "Bengaluru, IN", ip: "49.207.11.201", time: "2026-07-13T18:45:00" },
  { id: "l3", user: "Rohan Mehta", device: "Chrome · Windows", location: "Pune, IN", ip: "117.99.4.88", time: "2026-07-14T07:30:00" },
  { id: "l4", user: "Divya Reddy", device: "Edge · Windows", location: "Hyderabad, IN", ip: "182.156.3.44", time: "2026-07-11T11:20:00" },
  { id: "l5", user: "Vikram Singh", device: "Firefox · Linux", location: "Delhi, IN", ip: "14.192.77.9", time: "2026-06-28T16:10:00" },
];

// ── Backups ───────────────────────────────────────────────────────

export interface BackupEntry {
  id: string;
  createdAt: string;
  size: string;
  type: "manual" | "scheduled";
  status: "completed" | "failed";
}

export const recentBackups: BackupEntry[] = [
  { id: "b1", createdAt: "2026-07-14T02:00:00", size: "48.2 MB", type: "scheduled", status: "completed" },
  { id: "b2", createdAt: "2026-07-13T02:00:00", size: "47.8 MB", type: "scheduled", status: "completed" },
  { id: "b3", createdAt: "2026-07-12T15:32:00", size: "47.6 MB", type: "manual", status: "completed" },
  { id: "b4", createdAt: "2026-07-12T02:00:00", size: "47.5 MB", type: "scheduled", status: "completed" },
  { id: "b5", createdAt: "2026-07-11T02:00:00", size: "0 KB", type: "scheduled", status: "failed" },
];

// ── Customer categories ──────────────────────────────────────────

export const customerCategories = ["Retail", "Wholesale", "Distributor", "VIP", "Government", "Export"];

// ── Options used across settings forms ───────────────────────────

export const businessTypeOptions = [
  { value: "sole-proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "pvt-ltd", label: "Private Limited" },
  { value: "public-ltd", label: "Public Limited" },
];

export const indianStates = [
  "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat",
  "West Bengal", "Uttar Pradesh", "Rajasthan", "Kerala", "Punjab", "Haryana",
];

export const currencyOptions = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "AED", label: "UAE Dirham (د.إ)" },
];

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
];

export const timezoneOptions = [
  { value: "Asia/Kolkata", label: "(GMT+5:30) India Standard Time" },
  { value: "Asia/Dubai", label: "(GMT+4:00) Gulf Standard Time" },
  { value: "Asia/Singapore", label: "(GMT+8:00) Singapore Standard Time" },
];

export const dateFormatOptions = [
  { value: "dd-mm-yyyy", label: "DD-MM-YYYY (14-07-2026)" },
  { value: "mm-dd-yyyy", label: "MM-DD-YYYY (07-14-2026)" },
  { value: "yyyy-mm-dd", label: "YYYY-MM-DD (2026-07-14)" },
];

export const invoiceNumberFormatOptions = [
  { value: "prefix-yyyy-seq", label: "PREFIX/2026/0001" },
  { value: "prefix-seq", label: "PREFIX-0001" },
  { value: "yyyy-mm-seq", label: "2026-07-0001" },
];

export const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "ltr", label: "Litre (ltr)" },
  { value: "box", label: "Box" },
  { value: "dozen", label: "Dozen" },
];

export const barcodeFormatOptions = [
  { value: "EAN-13", label: "EAN-13 (13-digit, International)" },
  { value: "UPC-A", label: "UPC-A (12-digit, North America)" },
  { value: "CODE-128", label: "CODE-128 (Alphanumeric)" },
];
