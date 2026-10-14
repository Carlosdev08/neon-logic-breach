import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NeonBreach } from "./NeonBreach";

describe("NeonBreach application", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the landing screen and opens and closes the help modal", async () => {
    render(<NeonBreach />);

    expect(screen.getByRole("heading", { name: "NEON BREACH" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Seleccionar dificultad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fácil/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Medio/ })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/Récord:/)).toBeInTheDocument();

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
    fireEvent.click(await screen.findByRole("button", { name: /Fácil/ }));
    expect(screen.getByRole("button", { name: /Fácil/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 díg · 13 int · 4 min")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Avanzado/ }));
    expect(screen.getByText("5 díg · 8 int · 2 min")).toBeInTheDocument();
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

    fireEvent.click(await screen.findByRole("button", { name: "INICIAR OPERACIÓN" }));
    const seven = screen.getByRole("button", { name: "7", exact: true });
    fireEvent.click(seven);
    expect(seven).toBeDisabled();
    expect(screen.getByLabelText("Código actual: 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pista −150/ }));
    expect(
      await screen.findByText(/El \d no está en el código|Posición \d = \d/),
    ).toBeInTheDocument();
    expect(screen.getByText("Pistas 1/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pista −150/ })).toBeEnabled();
  });

  it("confirms progress reset rather than clearing it immediately", async () => {
    localStorage.setItem(
      "neon-breach:v2",
      JSON.stringify({ bestScore: 900, unlocked: 3, sound: false }),
    );
    render(<NeonBreach />);

    expect(await screen.findByText(/Récord:/)).toHaveTextContent("900");
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar progreso" }));
    expect(screen.getByRole("dialog", { name: "¿Reiniciar progreso?" })).toBeInTheDocument();
    expect(localStorage.getItem("neon-breach:v2")).toContain("900");

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("neon-breach:v2")!)).toMatchObject({
        bestScore: 0,
        unlocked: 1,
        sound: false,
      });
    });
  });
});
