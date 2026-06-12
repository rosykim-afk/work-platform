import type { Project, Folder } from "@/types";

/** 폴더명 · 프로젝트명 형태의 라벨 반환 */
export function getProjectLabel(project: Project, folders: Folder[]): string {
  if (project.folderId) {
    const folder = folders.find(f => f.id === project.folderId);
    if (folder) return `${folder.title} · ${project.title}`;
  }
  return project.title;
}

/** Select 드롭다운 항목용 JSX — 폴더명을 흐리게 표시 */
export function ProjectSelectLabel({ project, folders }: { project: Project; folders: Folder[] }) {
  const folder = project.folderId ? folders.find(f => f.id === project.folderId) : undefined;
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
      {folder && (
        <>
          <span className="text-muted-foreground truncate">{folder.title}</span>
          <span className="text-muted-foreground/50">·</span>
        </>
      )}
      <span className="truncate">{project.title}</span>
    </span>
  );
}
