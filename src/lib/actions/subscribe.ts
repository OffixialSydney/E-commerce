"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const trimmed = email.trim().toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmed || !emailPattern.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").insert({ email: trimmed });

  if (error) {
    // Unique constraint violation means they're already subscribed —
    // treat that as a friendly success rather than an error.
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}