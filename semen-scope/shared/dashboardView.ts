export const DASHBOARD_VIEWS = ["workspace", "audit", "fields", "history", "method", "quality"] as const;

export type DashboardView = (typeof DASHBOARD_VIEWS)[number];

/** Returns only supported laboratory dashboard views, defaulting safely to the active workspace. */
export function getDashboardViewFromSearch(search: string): DashboardView {
  const view = new URLSearchParams(search).get("view");
  return DASHBOARD_VIEWS.includes(view as DashboardView) ? view as DashboardView : "workspace";
}
