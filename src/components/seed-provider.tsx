"use client";

import { useEffect } from "react";

export function SeedProvider() {
  useEffect(() => {
    if (localStorage.getItem("seeded") === "v5") return;

    // 기존 데이터 전체 초기화
    localStorage.removeItem("folders");
    localStorage.removeItem("projects");
    localStorage.removeItem("tasks");
    localStorage.removeItem("boostings");
    localStorage.removeItem("routines");
    localStorage.removeItem("meetings");
    localStorage.removeItem("seeded_clearing");
    localStorage.setItem("seeded", "v5");

    window.location.reload();
  }, []);

  return null;
}
