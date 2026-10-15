import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NeonBreach } from "./NeonBreach";
import { initialState, reducer } from "@/game/reducer";
import { writeGameState } from "@/game/storage";

describe("NeonBreach application", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("renders the landing screen and opens and closes the help modal", async () => {
    render(<NeonBreach />);

    expect(screen.getByRole("heading", { name: "NEON BREACH" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Seleccionar dificultad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fácil/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elegir dificultad Medio" })).toBeInTheDocument();
    expect(await screen.findByText(/RÉCORD/i)).toBeInTheDocument();

    const helpButtons = screen.getAllByRole("button", { name: "Cómo jugar" });
    fireEvent.click(helpButtons[helpButtons.length - 1]!);
    expect(screen.getByRole("dialog", { name: "Cómo jugar" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Cómo jugar" })).not.toBeInTheDocument(),
    );
  });

  it("changes difficulty and shows different mission rules", async () => {
    render(<NeonBreach />);
    fireEvent.click(await screen.findByRole("button", { name: "Elegir dificultad Fácil" }));
    expect(screen.getByRole("heading", { name: "Fácil · Misiones" })).toBeInTheDocument();
    expect(screen.getAllByText("3 DÍGITOS").length).toBeGreaterThan(0);
    expect(screen.getByText("13 INTENTOS")).toBeInTheDocument();
    expect(screen.getByText("4 MIN")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Volver a dificultades" }));
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Avanzado" }));
    expect(screen.getAllByText("5 DÍGITOS").length).toBeGreaterThan(0);
    expect(screen.getByText("8 INTENTOS")).toBeInTheDocument();
    expect(screen.getByText("2 MIN")).toBeInTheDocument();
  });

  it("restores an active mission as paused after a page reload", async () => {
    const activeGame = reducer(initialState, {
      type: "START",
      missionIndex: 0,
      seed: 123,
      difficulty: "medio",
    });
    writeGameState(activeGame);

    render(<NeonBreach />);

    expect(await screen.findByRole("heading", { name: "EN PAUSA" })).toBeInTheDocument();
    expect(sessionStorage.getItem("neon-breach:active-game:v1")).toContain('"phase":"paused"');
  });

  it("starts a mission, accepts keyboard input, and supports pause/resume", async () => {
    render(<NeonBreach />);

    fireEvent.click(await screen.findByRole("button", { name: "Elegir dificultad Medio" }));
    fireEvent.click(screen.getByRole("button", { name: /Jugar misión 1/ }));
    expect(screen.getByRole("heading", { name: "Archivo Fantasma" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cerradura" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "7" });
    expect(screen.getByLabelText("Código actual: 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pausa" }));
    expect(screen.getByRole("heading", { name: "EN PAUSA" })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reanudar" }));
    expect(screen.queryByRole("heading", { name: "EN PAUSA" })).not.toBeInTheDocument();
  });

  it("prevents duplicate digits and applies the hint penalty visibly", async () => {
    render(<NeonBreach />);

    fireEvent.click(await screen.findByRole("button", { name: "Elegir dificultad Medio" }));
    fireEvent.click(screen.getByRole("button", { name: /Jugar misión 1/ }));
    const seven = screen.getByRole("button", { name: "7", exact: true });
    fireEvent.click(seven);
    expect(seven).toBeDisabled();
    expect(screen.getByLabelText("Código actual: 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pista −150/ }));
    expect(
      await screen.findByText(/El \d no está en el código|Posición \d = \d/),
    ).toBeInTheDocument();
    expect(screen.getByText("Pistas 1/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pista −250/ })).toBeEnabled();
  });

  it("confirms progress reset rather than clearing it immediately", async () => {
    sessionStorage.setItem(
      "neon-breach:v2",
      JSON.stringify({ bestScore: 900, unlocked: 3, sound: false }),
    );
    render(<NeonBreach />);

    expect(await screen.findByText(/RÉCORD/i)).toHaveTextContent("900");
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Medio" }));
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar progreso" }));
    expect(screen.getByRole("dialog", { name: "¿Reiniciar progreso?" })).toBeInTheDocument();
    expect(sessionStorage.getItem("neon-breach:v2")).toContain("900");

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() => {
      expect(JSON.parse(sessionStorage.getItem("neon-breach:v2")!)).toMatchObject({
        bestScore: 0,
        unlocked: 1,
        sound: false,
      });
    });
  });
});
