"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/command-palette";
import { SeedProvider } from "@/components/seed-provider";
import { ServerSync } from "@/components/server-sync";
import { useUndoKeyboard } from "@/hooks/use-undo-keyboard";

function UndoListener() {
  useUndoKeyboard();
  return null;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="ml-auto flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <span>⌘</span>K
            </kbd>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <CommandPalette />
      <SeedProvider />
      <ServerSync />
      <UndoListener />
    </>
  );
}
