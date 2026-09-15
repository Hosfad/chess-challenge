import { describe, expect, it } from "vitest";
import {
    BOARD_SIZE,
    isKnightMove,
    isOnBoard,
    isSquare,
    randomSquare,
} from "./util.js";

describe("isSquare", () => {
    it("accepts well-formed squares", () => {
        expect(isSquare({ row: 0, col: 0 })).toBe(true);
        expect(isSquare({ row: 4, col: 6 })).toBe(true);
    });

    it("rejects incorrect input values", () => {
        expect(isSquare(null)).toBe(false);
        expect(isSquare(undefined)).toBe(false);
        expect(isSquare(42)).toBe(false);
        expect(isSquare("a4")).toBe(false);
        expect(isSquare([4, 4])).toBe(false);
        expect(isSquare({})).toBe(false);
        expect(isSquare({ row: 3 })).toBe(false);
        expect(isSquare({ col: 3 })).toBe(false);
        expect(isSquare({ row: 1.5, col: 2 })).toBe(false);
        expect(isSquare({ row: 1, col: 2.5 })).toBe(false);
        expect(isSquare({ row: NaN, col: 2 })).toBe(false);
        expect(isSquare({ row: "1", col: 2 })).toBe(false);
        expect(isSquare({ row: 1, col: "2" })).toBe(false);
    });

});

describe("isOnBoard", () => {
    it("accepts the corners and the middle", () => {
        expect(isOnBoard({ row: 0, col: 0 })).toBe(true);
        expect(isOnBoard({ row: 7, col: 7 })).toBe(true);
        expect(isOnBoard({ row: 4, col: 4 })).toBe(true);
    });

    it("rejects squares outside the board", () => {
        expect(isOnBoard({ row: -1, col: 0 })).toBe(false);
        expect(isOnBoard({ row: 0, col: -1 })).toBe(false);
        expect(isOnBoard({ row: BOARD_SIZE, col: 0 })).toBe(false);
        expect(isOnBoard({ row: 0, col: BOARD_SIZE })).toBe(false);
    });
});

describe("isKnightMove", () => {
    const from = { row: 4, col: 4 };

    it("accepts all eight knight jumps", () => {
        const jumps = [
            { row: 6, col: 5 },
            { row: 6, col: 3 },
            { row: 5, col: 6 },
            { row: 5, col: 2 },
            { row: 3, col: 6 },
            { row: 3, col: 2 },
            { row: 2, col: 5 },
            { row: 2, col: 3 },
        ];
        for (const to of jumps) {
            expect(isKnightMove(from, to), JSON.stringify(to)).toBe(true);
        }
    });

    it("rejects landing on the starting square", () => {
        expect(isKnightMove(from, from)).toBe(false);
    });

});

describe("randomSquare", () => {
    it("always returns a square inside the board", () => {
        for (let i = 0; i < 200; i++) {
            expect(isOnBoard(randomSquare())).toBe(true);
        }
    });
});