import { describe, expect, it } from "vitest";
import { libraryFiles, toggleSelected } from "./library";

const files = [
  { id: "a", name: "Zebra.jpg", file_type: "image", size: 104, created_at: "2026-10-20T00:00:00Z" },
  { id: "b", name: "notes.pdf", file_type: "pdf", size: 500, created_at: "2026-10-18T00:00:00Z" },
  { id: "c", name: "apple.jpg", file_type: "image", size: 200, created_at: "2026-10-19T00:00:00Z" },
];
describe("native library behavior", () => {
  it("filters by category and case-insensitive filename", () => {
    expect(libraryFiles(files, "image", "  ZEBRA ", "recent").map(f => f.id)).toEqual(["a"]);
  });
  it("sorts recent and date newest first without mutating account files", () => {
    expect(libraryFiles(files, "all", "", "recent").map(f => f.id)).toEqual(["a", "c", "b"]);
    expect(libraryFiles(files, "all", "", "date", true).map(f => f.id)).toEqual(["b", "c", "a"]);
    expect(files.map(f => f.id)).toEqual(["a", "b", "c"]);
  });
  it("sorts name alphabetically", () => {
    expect(libraryFiles(files, "all", "", "name").map(f => f.id)).toEqual(["c", "b", "a"]);
  });
  it("sorts size largest first", () => {
    expect(libraryFiles(files, "all", "", "size").map(f => f.id)).toEqual(["b", "c", "a"]);
  });
  it("supports multi-selection and deselection without duplicate IDs", () => {
    expect(toggleSelected(toggleSelected([], "a"), "c")).toEqual(["a", "c"]);
    expect(toggleSelected(["a", "c"], "a")).toEqual(["c"]);
  });
});