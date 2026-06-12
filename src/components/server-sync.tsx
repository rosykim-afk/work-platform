"use client";

/**
 * ServerSync
 * ──────────
 * Chrome ↔ Claude 미리보기 브라우저 간 실시간 데이터 동기화.
 *
 * 동작 방식:
 *  1. 마운트 시 서버에서 최신 데이터를 가져와 Zustand 스토어를 채운다.
 *  2. 스토어 변경 → 500ms 디바운스 후 서버에 PUSH.
 *  3. 3초마다 서버를 폴링해 다른 브라우저의 변경을 PULL.
 *
 * 무한루프 방지: 서버 데이터를 적용하는 동안 `syncing` 플래그를 세워
 *               subscribe 콜백이 다시 PUSH 스케줄을 잡지 않게 한다.
 */

import { useEffect, useRef } from "react";
import { useFolderStore } from "@/store/folders";
import { useProjectStore } from "@/store/projects";
import { useTaskStore } from "@/store/tasks";
import { useBoostingStore } from "@/store/boosting";
import { useRoutineStore } from "@/store/routines";
import { useMeetingStore } from "@/store/meetings";

const POLL_MS    = 3000;
const DEBOUNCE_MS = 500;

type Snapshot = {
  folders?:  unknown[];
  projects?: unknown[];
  tasks?:    unknown[];
  boostings?:unknown[];
  routines?: unknown[];
  meetings?: unknown[];
};

function getSnapshot(): Snapshot {
  return {
    folders:   useFolderStore.getState().folders,
    projects:  useProjectStore.getState().projects,
    tasks:     useTaskStore.getState().tasks,
    boostings: useBoostingStore.getState().boostings,
    routines:  useRoutineStore.getState().routines,
    meetings:  useMeetingStore.getState().meetings,
  };
}

function applySnapshot(data: Snapshot) {
  // 빈 배열이어도 덮어써야 삭제가 반영됨 — undefined(키 없음)일 때만 건너뜀
  if (data.folders  !== undefined) useFolderStore.setState({ folders:   data.folders  as never });
  if (data.projects !== undefined) useProjectStore.setState({ projects: data.projects as never });
  if (data.tasks    !== undefined) useTaskStore.setState({ tasks:       data.tasks    as never });
  if (data.boostings!== undefined) useBoostingStore.setState({ boostings:data.boostings as never });
  if (data.routines !== undefined) useRoutineStore.setState({ routines: data.routines as never });
  if (data.meetings !== undefined) useMeetingStore.setState({ meetings: data.meetings as never });
}

export function ServerSync() {
  const syncing      = useRef(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJson     = useRef<string>("");

  async function push() {
    if (syncing.current) return;
    const snap = getSnapshot();
    const json = JSON.stringify(snap);
    if (json === lastJson.current) return;
    try {
      await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      lastJson.current = json;
    } catch {}
  }

  async function pull() {
    if (syncing.current) return;
    try {
      const res  = await fetch("/api/store", { cache: "no-store" });
      const data: Snapshot = await res.json();
      const json = JSON.stringify(data);
      if (json === lastJson.current) return;   // 변경 없으면 스킵
      // 서버가 완전히 비어있으면(모든 배열이 비어있거나 없는 경우) 덮어쓰지 않음
      const hasAny = Object.values(data).some(v => Array.isArray(v) && v.length > 0);
      // 현재 클라이언트도 비어있으면 서버 데이터가 비어있어도 적용(초기 로드)
      const localSnap = getSnapshot();
      const localHas  = Object.values(localSnap).some(v => Array.isArray(v) && v.length > 0);
      if (!hasAny && localHas) return;   // 서버 비어있는데 로컬 데이터가 있으면 스킵
      syncing.current = true;
      applySnapshot(data);
      lastJson.current = json;
      syncing.current = false;
    } catch {}
  }

  function schedulePush() {
    if (syncing.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(push, DEBOUNCE_MS);
  }

  // 1) 마운트 시 서버 최신 데이터 로드
  useEffect(() => {
    pull();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 스토어 변경 시 서버에 PUSH (디바운스)
  useEffect(() => {
    const unsubs = [
      useFolderStore.subscribe(schedulePush),
      useProjectStore.subscribe(schedulePush),
      useTaskStore.subscribe(schedulePush),
      useBoostingStore.subscribe(schedulePush),
      useRoutineStore.subscribe(schedulePush),
      useMeetingStore.subscribe(schedulePush),
    ];
    return () => {
      unsubs.forEach(u => u());
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) 주기적으로 서버 PULL
  useEffect(() => {
    const id = setInterval(pull, POLL_MS);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
