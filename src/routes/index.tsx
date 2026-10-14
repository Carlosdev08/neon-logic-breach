import { createFileRoute } from "@tanstack/react-router";
import { NeonBreach } from "@/components/game/NeonBreach";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEON BREACH — Juego de hackeo cyberpunk" },
      {
        name: "description",
        content:
          "Descifra códigos en cinco misiones cyberpunk. Juego de lógica en español para navegador.",
      },
      { property: "og:title", content: "NEON BREACH — Juego de hackeo cyberpunk" },
      {
        property: "og:description",
        content: "Descifra códigos en cinco misiones cyberpunk antes de que salte la alarma.",
      },
    ],
  }),
  component: NeonBreach,
});
