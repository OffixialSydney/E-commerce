"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageRead } from "@/lib/actions/admin/messages";

export function MessageReadToggle({ id, isRead }: { id: string; isRead: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    await markMessageRead(id, !isRead);
    setIsPending(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-navy/15 px-2.5 py-1 text-xs text-navy/70 hover:bg-navy/5 disabled:opacity-50"
    >
      {isRead ? "Mark unread" : "Mark read"}
    </button>
  );
}
