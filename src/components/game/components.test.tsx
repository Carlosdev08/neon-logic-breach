import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SAVE } from "@/game/storage";
import { initialState, reducer } from "@/game/reducer";
import { GameScreen, Key, Modal, Overlay, Stat, TitleScreen } from "@/components/game/components";

describe("game UI components", () => {
  it("renders the title screen and starts the selected mission", () => {
    const onStart = vi.fn();
    render(
      <TitleScreen
        save={DEFAULT_SAVE}
        loaded
        onStart={onStart}
        onDifficultyChange={vi.fn()}
        onReset={vi.fn()}
        onHelp={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "NEON BREACH" })).toBeInTheDocument();
    expect(screen.getByText("Recluta")).toBeInTheDocument();
    expect(screen.getByText("Progreso de rango")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar en la red/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Jugar misión 1/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Medio" }));
    expect(screen.getByRole("heading", { name: "Medio · Misiones" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Jugar misión 1/ }));
    expect(onStart).toHaveBeenCalledWith(0);
  });

  it("reveals corporate intel only after the previous mission is cleared", () => {
    const save = {
      ...DEFAULT_SAVE,
      progress: {
        ...DEFAULT_SAVE.progress,
        medio: { bestScore: 500, unlocked: 2 },
      },
    };
    render(
      <TitleScreen
        save={save}
        loaded
        onStart={vi.fn()}
        onDifficultyChange={vi.fn()}
        onReset={vi.fn()}
        onHelp={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Medio" }));
    expect(screen.getByText("Intel desbloqueada · Manifiesto de carga 09")).toBeInTheDocument();
    expect(screen.getByText(/Kurogane alteró los registros de envío/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jugar misión 2/ })).toBeInTheDocument();
  });
  it("keeps locked missions disabled and exposes help/reset actions", () => {
    const onHelp = vi.fn();
    const onReset = vi.fn();
    render(
      <TitleScreen
        save={{ ...DEFAULT_SAVE, unlocked: 1 }}
        loaded
        onStart={vi.fn()}
        onDifficultyChange={vi.fn()}
        onReset={onReset}
        onHelp={onHelp}
      />,
    );
    expect(screen.queryByRole("button", { name: /Misión 2 bloqueada/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Medio" }));
    expect(screen.getByRole("button", { name: /Misión 2 bloqueada/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar progreso" }));
    fireEvent.click(screen.getByRole("button", { name: "← Volver a dificultades" }));
    fireEvent.click(screen.getByRole("button", { name: "Cómo jugar" }));
    expect(onHelp).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("renders one opaque, readable victory score breakdown with a correct total", () => {
    const playing = reducer(initialState, { type: "START", missionIndex: 0, seed: 123 });
    const won = reducer({ ...playing, input: playing.secret }, { type: "SUBMIT" });
    expect(won.phase).toBe("won");
    expect(won.lastScore).not.toBeNull();

    render(<Overlay s={won} dispatch={vi.fn()} />);
    const breakdown = screen.getByLabelText("Desglose de puntuación");
    for (const label of ["Base", "Tiempo", "Intentos", "Racha", "Pistas", "Total"]) {
      expect(within(breakdown).getAllByText(label)).toHaveLength(1);
    }
    expect(within(breakdown).getByText(String(won.lastScore!.total))).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("bg-background");
    expect(breakdown).toHaveClass("grid-cols-[1fr_auto]");
  });

  it("shows stat values and applies danger styling", () => {
    render(
      <dl>
        <Stat label="Tiempo" value="0:20" tone="danger" />
      </dl>,
    );
    expect(screen.getByText("Tiempo")).toBeInTheDocument();
    expect(screen.getByText("0:20")).toHaveClass("text-destructive");
  });

  it("dispatches a digit from an enabled key and disables duplicates", () => {
    const state = reducer(initialState, { type: "START", missionIndex: 0, seed: 123 });
    const dispatch = vi.fn();
    const { rerender } = render(<Key d={4} s={state} dispatch={dispatch} sound={false} />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "DIGIT", digit: 4 });

    rerender(<Key d={4} s={{ ...state, input: [4] }} dispatch={dispatch} sound={false} />);
    expect(screen.getByRole("button", { name: "4" })).toBeDisabled();
  });

  it("renders the playing game screen and submits only a complete code", () => {
    const state = reducer(initialState, { type: "START", missionIndex: 0, seed: 123 });
    const dispatch = vi.fn();
    render(<GameScreen s={state} dispatch={dispatch} sound={false} />);
    expect(screen.getByRole("region", { name: "Cerradura" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ENVIAR" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Pista −150" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "HINT" });
  });

  it("shows the paused overlay and resumes when requested", () => {
    const playing = reducer(initialState, { type: "START", missionIndex: 0, seed: 123 });
    const paused = reducer(playing, { type: "PAUSE" });
    const dispatch = vi.fn();
    render(<Overlay s={paused} dispatch={dispatch} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reanudar" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "RESUME" });
  });

  it("closes a modal with its close button and Escape key", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Ayuda de prueba" onClose={onClose}>
        Contenido
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Ayuda de prueba" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
