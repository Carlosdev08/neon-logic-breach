import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.queryByRole("button", { name: /Jugar misión 1/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Elegir dificultad Medio" }));
    expect(screen.getByRole("heading", { name: "Medio · Misiones" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Jugar misión 1/ }));
    expect(onStart).toHaveBeenCalledWith(0);
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
    fireEvent.click(screen.getByRole("button", { name: "← Volver a dificultades" }));
    fireEvent.click(screen.getByRole("button", { name: "Cómo jugar" }));
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar progreso" }));
    expect(onHelp).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
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
