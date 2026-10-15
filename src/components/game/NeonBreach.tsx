import { useEffect, useReducer, useRef, useState } from "react";
import { type Difficulty } from "@/game/logic";
import { reducer, initialState, type GameState } from "@/game/reducer";
import {
  loadSave,
  writeSave,
  loadGameState,
  writeGameState,
  DEFAULT_SAVE,
  type SaveData,
} from "@/game/storage";
import { play } from "@/game/sound";
import { getSupabase } from "@/lib/supabase";
import { TitleScreen, GameScreen, Modal } from "@/components/game/components";
import { useGameKeyboard, useGameTimer } from "@/components/game/useGameControls";

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} border-primary text-primary hover:bg-primary hover:text-primary-foreground`;
const btnAccent = `${btn} border-accent bg-accent text-accent-foreground hover:bg-accent/80 font-semibold`;
const btnGhost = `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;
const btnDanger = `${btn} border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground`;

export function NeonBreach() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [loaded, setLoaded] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [help, setHelp] = useSta¶»§q«^