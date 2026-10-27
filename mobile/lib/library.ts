export type LibrarySort = "recent" | "name" | "size" | "date";
export type LibraryFile = { id: string; name: string; file_type: string; size: number; created_at: string };

export function libraryFiles<T extends LibraryFile>(files: T[], kind: string, query: string, sort: LibrarySort, ascending = false) {
  const search = query.trim().toLowerCase();
  const filtered = files.filter(f => (kind === "all" || f.file_type === kind) && f.name.toLowerCase().includes(search));
  return filtered.sort((a, b) => {
    let order = sort === "name" ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      : sort === "size" ? b.size - a.size
      : Date.parse(b.created_at) - Date.parse(a.created_at);
    if (ascending) order *= -1;
    return order || a.id.localeCompare(b.id);
  });
}

export function toggleSelected(selected: string[], id: string) {
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
}

export function fileExtension(name: string) {
  const extension = name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1];
  return extension?.toUpperCase() ?? "FILE";
}

export const libraryType = (kind: string) => kind === "image" ? "Image" : kind === "video" ? "Video" : kind === "audio" ? "Music" : "Document";