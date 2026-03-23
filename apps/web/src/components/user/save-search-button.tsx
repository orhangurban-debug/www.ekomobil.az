"use client";

import { useState } from "react";

export function SaveSearchButton({ queryParams }: { queryParams: object }) {
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function onSave() {
    const response = await fetch("/api/user/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryParams })
    });
    setState(response.ok ? "saved" : "error");
  }

  return (
    <button onClick={onSave} className="btn-secondary text-sm">
      {state === "saved" ? "Axtarış saxlanıldı" : state === "error" ? "Login tələb olunur" : "Axtarışı saxla"}
    </button>
  );
}
