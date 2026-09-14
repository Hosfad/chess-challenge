import type { GameState, Square } from "./types";

const API_BASE = "/api";

// Errors as values because i love Go :)
export async function safeAwait<TData, TError = Error>(
    promise: Promise<TData>
): Promise<[TData, null] | [null, TError]> {
    try {
        const result = await promise;
        return [result as TData, null];
    } catch (e) {
        return [null, e as TError];
    }
}

const getErrMessage = async (response: Response): Promise<Error> => {
    const data = (await response.json().catch(() => null)) as {
        error?: string;
    } | null;
    return new Error(data?.error ?? `Request failed (${response.status})`);
};

// Should impelemt schema validation, not needed for the sake of the test
export const createGame = async (): Promise<GameState> => {
    console.log("Creating a game");
    const response = await fetch(`${API_BASE}/game`, { method: "POST" });
    if (!response.ok) throw await getErrMessage(response);
    return response.json();
};

export const getGameState = async (gameId: string): Promise<GameState> => {
    const response = await fetch(
        `${API_BASE}/state?gameId=${encodeURIComponent(gameId)}`,
    );
    if (!response.ok) throw await getErrMessage(response);
    return response.json();
};

export const makeMove = async (gameId: string, to: Square): Promise<Square> => {
    const response = await fetch(`${API_BASE}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, to }),
    });
    if (!response.ok) throw await getErrMessage(response);
    const data = (await response.json()) as { knight: Square };
    return data.knight;
};

export const endGame = async (gameId: string) => {
    if (!gameId) return console.warn("No game id");

    const response = await fetch(`${API_BASE}/game/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
        keepalive: true,
    });
    if (!response.ok) throw await getErrMessage(response);
}