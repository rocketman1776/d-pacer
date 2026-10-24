import { describe, expect, it } from "vitest";
import { isForbiddenPath } from "./ForbiddenPage";
import { isPlannerPath } from "./NotFoundPage";

describe("isPlannerPath", () => {
  it("treats the site root as the planner", () => {
    expect(isPlannerPath("/")).toBe(true);
    expect(isPlannerPath("")).toBe(true);
  });

  it("treats any other path as a miss", () => {
    expect(isPlannerPath("/404")).toBe(false);
    expect(isPlannerPath("/403")).toBe(false);
    expect(isPlannerPath("/missing-mile")).toBe(false);
    expect(isPlannerPath("/privacy")).toBe(false);
  });
});

describe("isForbiddenPath", () => {
  it("matches /403", () => {
    expect(isForbiddenPath("/403")).toBe(true);
    expect(isForbiddenPath("/403/")).toBe(true);
    expect(isForbiddenPath("/404")).toBe(false);
  });
});
