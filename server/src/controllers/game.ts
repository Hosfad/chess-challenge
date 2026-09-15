import { Router } from "express";
import type { Game } from "../utils/types.js";
import { badRequest, isKnightMove, isOnBoard, isSquare, randomSquare } from "../utils/util.js";

const games = new Map<string, Game>();

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ ok: true });
});

router.post("/game", (_req, res) => {
    // better to use UUID but in this case no need to add a dependency :P
    const game: Game = {
        id: Math.random().toString(36),
        knight: randomSquare(),
    };
    games.set(game.id, game);
    res.status(201).json({ gameId: game.id, knight: game.knight });
});

router.post("/game/end", (req, res) => {
    const { gameId } = (req.body ?? {}) as { gameId?: unknown };

    if (typeof gameId !== "string" || !gameId) {
        return badRequest(res, "gameId is required");
    }

    games.delete(gameId);
    res.json({ ok: true });
});

router.get("/state", (req, res) => {
    const gameId = typeof req.query.gameId === "string" ? req.query.gameId : "";
    const game = games.get(gameId);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json({ gameId: game.id, knight: game.knight });
});

router.post("/move", (req, res) => {
    const { gameId, to } = (req.body ?? {}) as { gameId?: unknown; to?: unknown };

    if (typeof gameId !== "string" || !gameId) {
        return badRequest(res, "gameId is required");
    }

    const game = games.get(gameId);
    if (!game) {
        return badRequest(res, "Game not found");
    }

    if (!isSquare(to)) {
        return badRequest(res, "Invalid square");
    }

    if (!isOnBoard(to)) {
        return badRequest(res, "Square is not on the board");
    }

    if (!isKnightMove(game.knight, to)) {
        return badRequest(res, "Illegal move");
    }

    game.knight = to;
    res.json({ knight: game.knight });
});

export default router;