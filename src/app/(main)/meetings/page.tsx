"use client";

import { useState, useMemo } from "react";
import { Meeting, Project, Folder } from "@/types";
import { useMeetingStore } from "@/store/meetings";
import { useProjectStore } from "@/store/projects";
import { useFolderStore } from "@/store/folders";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { MeetingItem } from "@/components/meetings/meeting-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectionBar } from "@/components/ui/selection-bar";
import { useSelection } from "@/hooks/use-selection";
import { Plus, Users, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewTab = "upcoming" | "past";

interface ProjectGroup {
  projectId: string;       // actual projectId or "none"
  project?: Project;
  meetings: Meeting[];
}

interface FolderGroup {
  folderId: string;        // actual folderId or "no-folder" or "no-project"
  folder?: Folder;
  projectGroups: ProjectGroup[];
}

function buildFolderGroups(meetings: Meeting[], projects: Project[], folders: Folder[]): FolderGroup[] {
  // 1단계: projectId 기준으로 묶기
  const projectMap = new Map<string, { project?: Project; meetings: Meeting[] }>();

  for (const m of meetings) {
    const key = m.projectId ?? "none";
    if (!projectMap.has(key)) {
      const project = projects.find(p => p.id === m.projectId);
      projectMap.set(key, { project, meetings: [] });
    }
    projectMap.get(key)!.meetings.push(m);
  }

  // 2단계: folderId 기준으로 묶기
  const folderMap = new Map<string, { folder?: Folder; projectGroups: Map<string, { project?: Project; meetings: Meeting[] }> }>();

  for (const [projectId, { project, meetings: pMeetings }] of projectMap.entries()) {
    const fKey = project?.folderId ?? (projectId === "none" ? "no-project" : "no-folder");
    if (!folderMap.has(fKey)) {
      const folder = folders.find(f => f.id === project?.folderId);
      folderMap.set(fKey, { folder, projectGroups: new Map() });
    }
    folderMap.get(fKey)!.projectGroups.set(projectId, { project, meetings: pMeetings });
  }

  // 3단계: 배열로 변환 + 정렬
  const result: FolderGroup[] = Array.from(folderMap.entries()).map(([folderId, { folder, projectGroups }]) => ({
    folderId,
    folder,
    projectGroups: Array.from(projectGroups.entries()).map(([projectId, { project, meetings }]) => ({
      projectId,
      project,
      meetings,
    })).sort((a, b) => (a.project?.title ?? "").localeCompare(b.project?.title ?? "")),
  }));

  result.sort((a, b) => {
    if (a.folderId === "no-project") return 1;
    if (b.folderId === "no-project") return -1;
    if (a.folderId === "no-folder") return 1;
    if (b.folderId === "no-folder") return -1;
    return (a.folder?.title ?? "").localeCompare(b.folder?.title ?? "");
  });

  return result;
}

export default function MeetingsPage() {
  const { meetings, deleteMeeting } = useMeetingStore();
  const { projects } = useProjectStore();
  const { folders } = useFolderStore();
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<ViewTab>("upcoming");
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() =>
    meetings.filter(m => tab === "upcoming" ? m.date >= today : m.date < today)
      .sort((a, b) =>
        tab === "upcoming"
          ? a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "")
          : b.date.localeCompare(a.date)
      ),
    [meetings, tab, today]
  );

  const folderGroups = useMemo(() =>
    buildFolderGroups(filtered, projects, folders),
    [filtered, projects, folders]
  );

  const upcomingCount = meetings.filter(m => m.date >= today).length;
  const pastCount = meetings.filter(m => m.date < today).length;

  const filteredIds = useMemo(() => filtered.map(m => m.id), [filtered]);
  const sel = useSelection(filteredIds);

  function handleDeleteSelected() {
    sel.selected.forEach(id => deleteMeeting(id));
    toast.error(`${sel.count}개 회의가 삭제됐어요`);
    sel.clear();
  }

  function toggleFolder(key: string) {
    setCollapsedFolders(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function toggleProject(key: string) {
    setCollapsedProjects(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">회의/미팅</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4 mr-1.5" /> 회의 등록
        </Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        {(["upcoming", "past"] as ViewTab[]).map(t => (
          <button
            key={t}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab(t)}
          >
            {t === "upcoming" ? "예정" : "지난 회의"}
            <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
              {t === "upcoming" ? upcomingCount : pastCount}
            </Badge>
          </button>
        ))}
      </div>

      {/* 내용 */}
      {folderGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-lg border border-dashed">
          <Users className="size-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{tab === "upcoming" ? "예정된 회의가 없어요" : "지난 회의가 없어요"}</p>
          {tab === "upcoming" && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreating(true)}>
              <Plus className="size-4 mr-1" /> 회의 등록
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {folderGroups.map(fg => {
            const isFolderCollapsed = collapsedFolders.has(fg.folderId);
            const totalCount = fg.projectGroups.reduce((s, pg) => s + pg.meetings.length, 0);
            const showFolderHeader = fg.folderId !== "no-project" && fg.folderId !== "no-folder";

            return (
              <div key={fg.folderId} className="space-y-1">
                {/* 폴더 헤더 */}
                {showFolderHeader && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted/40 transition-colors text-left"
                    onClick={() => toggleFolder(fg.folderId)}
                  >
                    {isFolderCollapsed
                      ? <ChevronRight className="size-3.5 text-muted-foreground" />
                      : <ChevronDown className="size-3.5 text-muted-foreground" />}
                    <FolderOpen className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {fg.folder?.title ?? "기타"}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{totalCount}</Badge>
                  </button>
                )}

                {/* 프로젝트 그룹들 */}
                {!isFolderCollapsed && (
                  <div className={cn("space-y-2", showFolderHeader && "ml-4")}>
                    {fg.projectGroups.map(pg => {
                      const isProjCollapsed = collapsedProjects.has(pg.projectId);
                      return (
                        <div key={pg.projectId} className="rounded-lg border bg-card overflow-hidden">
                          {/* 프로젝트 헤더 */}
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                            onClick={() => toggleProject(pg.projectId)}
                          >
                            {isProjCollapsed
                              ? <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                              : <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
                            {pg.project ? (
                              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: pg.project.color }} />
                            ) : (
                              <span className="size-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
                            )}
                            <span className="text-sm font-medium flex-1 truncate">
                              {pg.project?.title ?? "프로젝트 미연결"}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                              {pg.meetings.length}
                            </Badge>
                          </button>

                          {/* 회의 목록 */}
                          {!isProjCollapsed && (
                            <div className="px-3 pb-3 space-y-1.5 border-t pt-2">
                              {pg.meetings.map(m => (
                                <MeetingItem
                                  key={m.id}
                                  meeting={m}
                                  isPast={tab === "past"}
                                  isSelected={sel.isSelected(m.id)}
                                  onToggleSelect={sel.toggle}
                                  selectionMode={sel.hasSelection}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MeetingForm open={creating} onClose={() => setCreating(false)} />

      <SelectionBar
        count={sel.count}
        total={filteredIds.length}
        onSelectAll={sel.selectAll}
        onClear={sel.clear}
        onDelete={handleDeleteSelected}
      />
    </div>
  );
}
