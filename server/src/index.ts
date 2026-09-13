import express, { Response } from "express";

const PORT = Number(process.env.PORT ?? 3001);

const BOARD_SIZE = 8;

interface Square {
    row: number;
    col: number;
}

interface Game {
    id: string;
    knight: Square;
}

const games = new Map<string, Game>();

const app = express();

app.use(express.json());

const isSquare = (value: unknown): value is Square => {
    if (typeof value !== "object" || value === null) return false;
    const { row, col } = value as Record<string, unknown>;
    return (
        typeof row === "number" &&
        Number.isInteger(row) &&
        typeof col === "number" &&
        Number.isInteger(col)
    );
};

const isOnBoard = ({ row, col }: Square) =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

const isKnightMove = (from: Square, to: Square) => {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

const randomSquare = (): Square => ({
    row: Math.floor(Math.random() * BOARD_SIZE),
    col: Math.floor(Math.random() * BOARD_SIZE),
});

const createGame = (): Game => {
    // better to use UUID but in this case no need to add a dependency :P 
    const game: Game = { id: Math.random().toString(36), knight: randomSquare() };
    games.set(game.id, game);
    return game;
};


const error = (res: Response) => (msg: string) => {
    return res.status(400).json({ error: msg })
}

app.post("/api/game", (_req, res) => {
    const game = createGame();
    res.status(201).json({ gameId: game.id, knight: game.knight });
});

app.post("/api/game/end", (req, res) => {
    const { gameId } = (req.body ?? {}) as { gameId?: unknown };

    if (typeof gameId !== "string" || !gameId) {
        return error(res)("gameId is required");
    }

    games.delete(gameId);
    res.json({ ok: true });
});

app.get("/api/state", (req, res) => {
    const gameId = typeof req.query.gameId === "string" ? req.query.gameId : "";
    const game = games.get(gameId);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json({ gameId: game.id, knight: game.knight });
});

app.post("/api/move", (req, res) => {
    const { gameId, to } = (req.body ?? {}) as { gameId?: unknown; to?: unknown };

    const err = error(res);


    if (typeof gameId !== "string" || !gameId) {
        return err("gameId is required");
    }

    const game = games.get(gameId);
    if (!game) {
        return err("Game not found");
    }

    if (!isSquare(to)) {
        return err("Invalid square");
    }

    if (!isOnBoard(to)) {
        return err("Square is not on the board");
    }

    if (!isKnightMove(game.knight, to)) {
        return err("Ilegal move");
    }

    game.knight = to;
    res.json({ knight: game.knight });
});

app.listen(PORT, () => {
    console.log(`do be listeneing on ${PORT}`);
});