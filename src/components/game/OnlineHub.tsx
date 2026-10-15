import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isOnlineConfigured } from "@/lib/supabase";

type Period = "global" | "weekly" | "daily";
type Score = {
  id: string;
  score: number;
  difficulty: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};
const field =
  "mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground";
const button =
  "border border-primary px-3 py-2 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50";
const getUsername = (row: Score) =>
  (Array.isArray(row.profiles) ? row.profiles[0]?.username : row.profiles?.username) ?? "Operador";

export function OnlineHub() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [period, setPeriod] = useState<Period>("global");
  const [scores, setScores] = useState<Score[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const loadScores = us¶»§q«^