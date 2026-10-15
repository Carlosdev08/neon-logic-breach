import { useEffect, useRef, useState, type ReactNode, type Dispatch } from "react";
import { OnlineHub } from "@/components/game/OnlineHub";
import {
  HINT_PENALTIES,
  DIFFICULTIES,
  getMissionsForDifficulty,
  type Difficulty,
} from "@/game/logic";
import { type GameState, type Action } from "@/game/reducer";
import { play } from "@/game/sound";
import { getRankProgress, type SaveData } from "@/game/storage";

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} border-primary text-primary hover:bg-primary hover:text-primary-foreground`;
const btnAccent = `${btn} border-accent bg-accent text-accent-foreground hover:bg-accent/80 font-semibold`;
const btnGhost = `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;

const MISSION_INTEL = [
  {
    title: "Manifiesto de carga 09",
    text: "Kurogane alterÃ³ los registros de envÃ­o para ocultar material destinado al distrito industrial. La Ãºltima copia apunta a un intermediario dentro del Consorcio Eclipse.",
  },
  {
    title: "Informe Helix / Proyecto LÃ¡zaro",
    text: "Helix BiogenÃ©tica probÃ³ un protocolo de modificaciÃ³n neuronal sin consentimiento. Una firma digital conecta el experimento con contratos ¶»§q«^