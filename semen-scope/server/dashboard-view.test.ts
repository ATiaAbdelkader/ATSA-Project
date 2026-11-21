import { describe, expect, it } from "vitest";
import { getDashboardViewFromSearch } from "@shared/dashboardView";

describe("laboratory dashboard view routing", () => {
  it("accepts the browser-local Field Review view and rejects unsupported routes", () => {
    expect(getDashboardViewFromSearch("?view=fields")).toBe("fields");
    expect(getDashboardViewFromSearch("?view=audit")).toBe("audit");
    expect(getDashboardViewFromSearch("?view=unknown")).toBe("workspace");
    expect(getDashboardViewFromSearch("")).toBe("workspace");
  });
});
