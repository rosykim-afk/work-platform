"use client";

import { useState } from "react";
import { useFolderStore } from "@/store/folders";
import { useProjectStore } from "@/store/projects";
import { useTaskStore } from "@/store/tasks";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectDetail } from "@/components/projects/project-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { SelectionBar } from "@/components/ui/selection-bar";
import { useSelection } from "@/hooks/use-selection";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { folders, addFolder, updateFolder, deleteFolder } = useFolderStore();
  const { projects, deleteProject } = useProjectStore();
  const { tasks } = useTaskStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingProjectFolderId, setCreatingProjectFolderId] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderTitle, setEditingFolderTitle] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const selected = projects.find(p => p.id === selectedId) ?? null;

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const sel = useSelection(filteredProjects.map(p => p.id));

  function handleDeleteSelected() {
    sel.selected.forEach(id => { deleteProject(id); if (selectedId === id) setSelectedId(null); });
    toast.error(`${sel.count}개 프로젝트가 삭제됐어요`);
    sel.clear();
  }

  function toggleFolder(id: string) {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddFolder() {
    if (!newFolderTitle.trim()) return;
    const folder = addFolder(newFolderTitle.trim());
    setOpenFolders(prev => new Set(prev).add(folder.id));
    setNewFolderTitle("");
    setNewFolderMode(false);
  }

  function handleRenameFolder(id: string) {
    if (editingFolderTitle.trim()) updateFolder(id, editingFolderTitle.trim());
    setEditingFolderId(null);
  }

  function handleDeleteFolder(id: string) {
    deleteFolder(id);
  }

  function openNewProject(folderId?: string) {
    setCreatingProjectFolderId(folderId);
    setCreatingProject(true);
  }

  function ProjectRow({ projectId }: { projectId: string }) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    if (!filteredProjects.find(p => p.id === projectId)) return null;

    const doneCount = tasks.filter(t => t.projectId === project.id && t.status === "done").length;
    const totalCount = tasks.filter(t => t.projectId === project.id).length;
    const isDetailSelected = selectedId === project.id;
    const isChecked = sel.isSelected(project.id);

    return (
      <HoverCard>
        <HoverCardTrigger
          render={
            <button
              onClick={() => {
                if (sel.hasSelection) { sel.toggle(project.id); return; }
                setSelectedId(project.id);
              }}
              className={cn(
                "w-full text-left rounded-md px-3 py-2.5 transition-colors group",
                isChecked ? "bg-accent/70" : isDetailSelected ? "bg-accent" : "hover:bg-accent"
              )}
            />
          }
        >
          <div className="flex items-center gap-2.5">
            {/* 체크박스 */}
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => sel.toggle(project.id)}
              onClick={e => e.stopPropagation()}
              className={cn(
                "size-3.5 rounded cursor-pointer accent-primary shrink-0 transition-opacity",
                sel.hasSelection || isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            />
            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            <span className="text-sm font-medium truncate">{project.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 pl-5">
            <Badge variant="secondary" className={cn("text-xs px-1.5 py-0 h-5", PROJECT_STATUS_COLOR[project.status])}>
              {PROJECT_STATUS_LABEL[project.status]}
            </Badge>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">{doneCount}/{totalCount} 완료</span>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-56 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            <p className="text-sm font-semibold truncate">{project.title}</p>
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground">{project.description}</p>
          )}
          {totalCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>달성률</span>
                <span>{doneCount}/{totalCount}</span>
              </div>
              <Progress value={totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0} className="h-1.5" />
            </div>
          )}
          {(project.startDate || project.endDate) && (
            <p className="text-xs text-muted-foreground">
              {project.startDate}{project.endDate ? ` ~ ${project.endDate}` : ""}
            </p>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  }

  const noFolderProjects = filteredProjects.filter(p => !p.folderId);

  return (
    <>
    <div className="flex h-[calc(100vh-3rem)] -m-6 overflow-hidden">
      {/* 왼쪽: 프로젝트 목록 */}
      <div className="w-72 shrink-0 flex flex-col border-r">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">프로젝트</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" title="새 폴더" onClick={() => setNewFolderMode(true)}>
                <FolderPlus className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" title="새 프로젝트 (미분류)" onClick={() => openNewProject()}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* 새 폴더 입력 */}
          {newFolderMode && (
            <div className="px-1 py-1">
              <Input
                autoFocus
                className="h-7 text-sm"
                placeholder="폴더 이름"
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") setNewFolderMode(false);
                }}
                onBlur={() => { if (!newFolderTitle.trim()) setNewFolderMode(false); }}
              />
            </div>
          )}

          {/* 폴더별 그룹 */}
          {folders.map(folder => {
            const folderProjects = filteredProjects.filter(p => p.folderId === folder.id);
            const isOpen = openFolders.has(folder.id);

            return (
              <Collapsible key={folder.id} open={isOpen} onOpenChange={() => toggleFolder(folder.id)}>
                <div className="flex items-center gap-1 group/folder rounded-md hover:bg-accent/50 pr-1">
                  <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-left">
                    {isOpen ? <ChevronDown className="size-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
                    {editingFolderId === folder.id ? (
                      <Input
                        autoFocus
                        className="h-6 text-sm px-1"
                        value={editingFolderTitle}
                        onChange={(e) => setEditingFolderTitle(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") handleRenameFolder(folder.id);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        onBlur={() => handleRenameFolder(folder.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="text-sm font-medium truncate">{folder.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {projects.filter(p => p.folderId === folder.id).length}
                        </span>
                      </>
                    )}
                  </CollapsibleTrigger>

                  {/* 폴더에 프로젝트 직접 추가 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openNewProject(folder.id); }}
                    className="size-6 flex items-center justify-center rounded opacity-0 group-hover/folder:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                    title="프로젝트 추가"
                  >
                    <Plus className="size-3.5" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/folder:opacity-100 transition-opacity shrink-0" />}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => { setEditingFolderId(folder.id); setEditingFolderTitle(folder.title); }}>
                        <Pencil className="size-3.5 mr-2" /> 이름 변경
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteFolder(folder.id)}>
                        <Trash2 className="size-3.5 mr-2" /> 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CollapsibleContent>
                  <div className="pl-4 space-y-0.5 mt-0.5">
                    {folderProjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-2">프로젝트가 없어요</p>
                    ) : (
                      folderProjects.map(p => <ProjectRow key={p.id} projectId={p.id} />)
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* 폴더 없는 프로젝트 */}
          {noFolderProjects.length > 0 && (
            <div className="space-y-0.5 mt-1">
              {folders.length > 0 && (
                <p className="text-xs text-muted-foreground px-3 py-1">미분류</p>
              )}
              {noFolderProjects.map(p => <ProjectRow key={p.id} projectId={p.id} />)}
            </div>
          )}

          {filteredProjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "검색 결과가 없어요" : "프로젝트가 없어요"}
            </p>
          )}
        </div>
        </ScrollArea>
      </div>

      {/* 구분선 */}
      <div className="w-px bg-border shrink-0" />

      {/* 오른쪽: 프로젝트 상세 */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ProjectDetail key={selected.id} project={selected} onDeleted={() => setSelectedId(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <FolderOpen className="size-10 opacity-30" />
            <p className="text-sm">프로젝트를 선택하거나 새로 만드세요</p>
            <Button variant="outline" size="sm" onClick={() => openNewProject()}>
              <Plus className="size-4 mr-1" /> 새 프로젝트
            </Button>
          </div>
        )}
      </div>
    </div>
    <ProjectForm
      open={creatingProject}
      onClose={() => setCreatingProject(false)}
      defaultFolderId={creatingProjectFolderId}
    />
    <SelectionBar
      count={sel.count}
      total={filteredProjects.length}
      onSelectAll={sel.selectAll}
      onClear={sel.clear}
      onDelete={handleDeleteSelected}
    />
    </>
  );
}
