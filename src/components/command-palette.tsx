"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";
import { useBoostingStore } from "@/store/boosting";
import { useMeetingStore } from "@/store/meetings";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, FolderKanban, Zap, RefreshCw, Users, CalendarDays, CheckSquare } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { boostings } = useBoostingStore();
  const { meetings } = useMeetingStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  const activeTasks = tasks.filter(t => t.status !== "done" && t.status !== "cancelled");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="검색하거나 이동할 페이지를 입력하세요..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없어요</CommandEmpty>

        <CommandGroup heading="페이지">
          {[
            { label: "메인", href: "/", icon: LayoutDashboard },
            { label: "월간 캘린더", href: "/calendar", icon: CalendarDays },
            { label: "프로젝트", href: "/projects", icon: FolderKanban },
            { label: "부스팅", href: "/boosting", icon: Zap },
            { label: "루틴", href: "/routines", icon: RefreshCw },
            { label: "회의/미팅", href: "/meetings", icon: Users },
          ].map(item => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="size-4 mr-2 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="프로젝트">
              {projects.map(p => (
                <CommandItem key={p.id} onSelect={() => go("/projects")}>
                  <span className="size-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: p.color, display: "inline-block" }} />
                  {p.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {activeTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="업무">
              {activeTasks.slice(0, 8).map(t => (
                <CommandItem key={t.id} onSelect={() => go("/projects")}>
                  <CheckSquare className="size-4 mr-2 text-muted-foreground" />
                  {t.title}
                  {t.dueDate && <span className="ml-auto text-xs text-muted-foreground">{t.dueDate}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {boostings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="부스팅">
              {boostings.slice(0, 5).map(b => (
                <CommandItem key={b.id} onSelect={() => go("/boosting")}>
                  <Zap className="size-4 mr-2 text-muted-foreground" />
                  {b.title}
                  <span className="ml-auto text-xs text-muted-foreground">{b.exposureSite}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {meetings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="회의">
              {meetings.slice(0, 5).map(m => (
                <CommandItem key={m.id} onSelect={() => go("/meetings")}>
                  <Users className="size-4 mr-2 text-muted-foreground" />
                  {m.title}
                  <span className="ml-auto text-xs text-muted-foreground">{m.date}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
