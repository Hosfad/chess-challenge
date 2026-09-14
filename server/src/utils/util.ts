import type { Response } from "express";
import type { Square } from "./types.js";

export const BOARD_SIZE = 8;

export const isSquare = (value: unknown): value is Square => {
    if (typeof value !== "object" || value === null) return false;
    const { row, col } = value as Record<string, unknown>;
    return (
        typeof row === "number" &&
        Number.isInteger(row) &&
        typeof col === "number" &&
        Number.isInteger(col)
    );
};

export const isOnBoard = ({ row, col }: Square): boolean =>
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const isKnightMove = (from: Square, to: Square): boolean => {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

export const randomSquare = (): Square => ({
    row: Math.floor(Math.random() * BOARD_SIZE),
    col: Math.floor(Math.random() * BOARD_SIZE),
});

export const badRequest = (res: Response, message: string) =>
    res.status(400).json({ error: message });