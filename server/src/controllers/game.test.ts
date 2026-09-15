import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import type { Square } from "../utils/types.js";
import { BOARD_SIZE, isOnBoard } from "../utils/util.js";

const KNIGHT_JUMPS: ReadonlyArray<readonly [number, number]> = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
];

const legalTargetsFrom = (square: Square): Square[] =>
    KNIGHT_JUMPS.map(([row, col]) => ({
        row: square.row + row,
        col: square.col + col,
    })).filter(isOnBoard);

const expectGameBody = (body: { gameId?: any; knight?: unknown }) => {
    expect(typeof body.gameId).toBe("string");
    expect(body.gameId!.length).toBeGreaterThan(0);
    const knight = body.knight as Square;
    expect(isOnBoard(knight)).toBe(true);
    return { gameId: body.gameId as string, knight };
};

describe("POST /api/game", () => {
    it("creates a game at a random square", async () => {
        const response = await request(app).post("/api/game");
        expect(response.status).toBe(201);
        expectGameBody(response.body);
    });

    it("places the knight inside the board every time", async () => {
        for (let i = 0; i < 50; i++) {
            const response = await request(app).post("/api/game");
            const { knight } = expectGameBody(response.body);
            expect(isOnBoard(knight)).toBe(true);
        }
    });
});

describe("GET /api/state", () => {
    it("returns the state of an existing game", async () => {
        const create = await request(app).post("/api/game");
        const { gameId, knight } = expectGameBody(create.body);

        const response = await request(app).get("/api/state").query({ gameId });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ gameId, knight });
    });

    it("returns 404 for an unknown game", async () => {
        const response = await request(app)
            .get("/api/state")
            .query({ gameId: "nope" });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Game not found" });
    });
});

describe("POST /api/game/end", () => {
    it("removes an existing game", async () => {
        const create = await request(app).post("/api/game");
        const { gameId } = expectGameBody(create.body);

        const end = await request(app).post("/api/game/end").send({ gameId });
        expect(end.status).toBe(200);
        expect(end.body).toEqual({ ok: true });

        const state = await request(app).get("/api/state").query({ gameId });
        expect(state.status).toBe(404);
    });

    it("rejects a missing gameId", async () => {
        const response = await request(app).post("/api/game/end").send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "gameId is required" });
    });
});

describe("POST /api/move", () => {
    const createGame = async (): Promise<{
        gameId: string;
        knight: Square;
    }> => {
        const create = await request(app).post("/api/game");
        return expectGameBody(create.body);
    };

    it("rejects a missing gameId", async () => {
        const { knight } = await createGame();
        const response = await request(app)
            .post("/api/move")
            .send({ to: legalTargetsFrom(knight)[0] });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "gameId is required" });
    });

    it("rejects moves against an unknown game", async () => {
        const response = await request(app)
            .post("/api/move")
            .send({ gameId: "ghost", to: { row: 4, col: 4 } });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Game not found" });
    });

    it("rejects a malformed destination", async () => {
        const { gameId } = await createGame();
        for (const to of [undefined, null, "e4", { row: 2 }, [2, 5]]) {
            const response = await request(app)
                .post("/api/move")
                .send({ gameId, to });
            expect(response.status, JSON.stringify(to)).toBe(400);
            expect(response.body).toEqual({ error: "Invalid square" });
        }
    });

    it("rejects a destination off the board", async () => {
        const { gameId } = await createGame();
        for (const to of [
            { row: -1, col: 0 },
            { row: 0, col: -1 },
            { row: BOARD_SIZE, col: 0 },
            { row: 0, col: BOARD_SIZE },
        ]) {
            const response = await request(app)
                .post("/api/move")
                .send({ gameId, to });
            expect(response.status, JSON.stringify(to)).toBe(400);
            expect(response.body).toEqual({ error: "Square is not on the board" });
        }
    });

    it("rejects an illegal move", async () => {
        const { gameId, knight } = await createGame();
        const to = { row: knight.row, col: (knight.col + 1) % BOARD_SIZE };
        expect(isOnBoard(to)).toBe(true);

        const response = await request(app).post("/api/move").send({ gameId, to });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Illegal move" });
    });

    it("accepts a legal move and updates the game state", async () => {
        const { gameId, knight } = await createGame();
        const to = legalTargetsFrom(knight)[0];

        const move = await request(app).post("/api/move").send({ gameId, to });
        expect(move.status).toBe(200);
        expect(move.body).toEqual({ knight: to });

        const state = await request(app).get("/api/state").query({ gameId });
        expect(state.body.knight).toEqual(to);
    });

    it("moves again from the updated position", async () => {
        const { gameId, knight } = await createGame();
        const first = legalTargetsFrom(knight)[0];

        await request(app).post("/api/move").send({ gameId, to: first });

        const second = legalTargetsFrom(first)[0];
        const response = await request(app)
            .post("/api/move")
            .send({ gameId, to: second });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ knight: second });
    });

    it("rejects a move that is illegal from the updated position", async () => {
        const { gameId, knight } = await createGame();
        const first = legalTargetsFrom(knight)[0];

        await request(app).post("/api/move").send({ gameId, to: first });

        const to = { row: first.row, col: (first.col + 2) % BOARD_SIZE };
        expect(isOnBoard(to)).toBe(true);

        const response = await request(app).post("/api/move").send({ gameId, to });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Illegal move" });
    });
});

describe("GET /api/health", () => {
    it("reports the api is up", async () => {
        const response = await request(app).get("/api/health");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ok: true });
    });
});