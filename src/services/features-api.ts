// ─────────────────────────────────────────────────────────────────────────────
// PATCH: src/services/api.ts
//
// Add these two API objects to your existing api.ts file.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "@/lib/api-client";

// ── Burnout API ───────────────────────────────────────────────────────────────
export const burnoutApi = {
  getTeam: () =>
    apiClient.get("/burnout/team"),

  getMe: () =>
    apiClient.get("/burnout/me"),

  getUser: (userId: string) =>
    apiClient.get(`/burnout/user/${userId}`),

  alertManagers: (projectId: string) =>
    apiClient.post(`/burnout/alert/${projectId}`),
};

// ── Post-mortem API ───────────────────────────────────────────────────────────
export const postMortemApi = {
  generate: (projectId: string) =>
    apiClient.get(`/postmortem/${projectId}`),
};
