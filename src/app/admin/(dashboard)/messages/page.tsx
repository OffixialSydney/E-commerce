import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageReadToggle } from "@/components/admin/message-read-toggle";
export const metadata: Metadata = { title: "Messages" };
type Message = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  const list: Message[] = messages ?? [];
  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Messages</h1>
      <p className="mt-1 text-sm text-navy/60">
        {list.filter((m) => !m.is_read).length} unread of {list.length}
      </p>
      <div className="mt-6 space-y-3">
        {list.map((message) => (
          <div
            key={message.id}
            className={`rounded-2xl border p-5 ${
              message.is_read
                ? "border-navy/10 bg-white"
                : "border-gold/40 bg-gold/5"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-navy">{message.full_name}</p>
                <p className="text-xs text-navy/50">
                  {message.phone && <span>{message.phone} · </span>}
                  {message.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {message.phone && (
                  <a
                    href={buildWhatsAppLink(message.phone, {
                      note: `Hi ${message.full_name}, this is Sid Bespoke replying to your message.`,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-navy/15 px-2.5 py-1 text-xs text-navy/70 hover:bg-navy/5"
                  >
                    WhatsApp
                  </a>
                )}
                <MessageReadToggle
                  id={message.id}
                  isRead={message.is_read}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-navy/80">
              {message.message}
            </p>
            <p className="mt-2 text-xs text-navy/40">
              {new Date(message.created_at).toLocaleString("en-NG")}
            </p>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-navy/15 py-16 text-center text-navy/50">
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}