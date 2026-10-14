export type GuessFeedback = {
  exact: number;
  misplaced: number;
};

export type Puzzle = {
  secret: string;
  maxAttempts: number;
};

export function createPuzzle(length = 4, maxAttempts = 8): Puzzle {
  if (!Number.isInteger(length) || length < 1 || length > 10) {
    throw new RangeError("La longitud debe estar entre 1 y 10.");
  }
  const digits = Array.from({ length: 10 }, (_, index) => String(index));
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return { secret: digits.slice(0, length).join(""), maxAttempts };
}

export function evaluateGuess(secret: string, guess: string): GuessFeedback {
  if (!/^\d+$/.test(secret) || !/^\d+$/.test(guess) || secret.length !== guess.length) {
    throw new Error("El código debe contener el mismo número de dígitos.");
  }
  let exact = 0;
  const secretCounts = new Map<string, number>();
  const guessCounts = new Map<string, number>();
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      exact++;
    } else {
      secretCounts.set(secret[i], (secretCounts.get(secret[i]) ?? 0) + 1);
      guessCounts.set(guess[i], (guessCounts.get(guess[i]) ?? 0) + 1);
    }
  }
  let misplaced = 0;
  for (const [digit, count] of guessCounts) {
    misplaced += Math.min(count, secretCounts.get(digit) ?? 0);
  }
  return { exact, misplaced };
}

export function isSolved(secret: string, guess: string): boolean {
  return secret === guess;
}
