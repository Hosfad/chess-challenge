import { useRef, useState } from "react";
import { BOARD_SIZE, KNIGHT_JUMPS } from "../utils/constants";
import type { Square } from "../utils/types";

const knightMovesFrom = ({ row, col }: Square): Square[] =>
    KNIGHT_JUMPS.map((jump) => ({
        row: row + jump.row,
        col: col + jump.col,
    }));

const isSameSquare = (a: Square, b: Square) =>
    a.row === b.row && a.col === b.col;

const isLightSquare = ({ row, col }: Square) => (row + col) % 2 === 0;

const squareFromPoint = (
    el: HTMLElement | null,
    clientX: number,
    clientY: number,
): Square | null => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const squareSize = rect.width / BOARD_SIZE;
    const col = Math.floor((clientX - rect.left) / squareSize);
    const row = Math.floor((clientY - rect.top) / squareSize);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return null;
    }
    return { row, col };
};

const allSquares = Array.from(
    { length: BOARD_SIZE * BOARD_SIZE },
    (_, index) => ({
        row: Math.floor(index / BOARD_SIZE),
        col: index % BOARD_SIZE,
    }),
);

type BoardProps = {
    knight: Square | null;
    isMoving: boolean;
    onMove: (to: Square) => Promise<boolean>;
    onError: (message: string | null) => void;
};

function FileCoordinates({ row }: { row: number }) {
    /* 97 is ASCII for a*/
    return Array.from({ length: BOARD_SIZE }, (_, index) => (
        <span
            key={`file-${row}-${index}`}
            className="coord"
            style={{ gridColumn: index + 2, gridRow: row }}
        >
            {String.fromCharCode(97 + index)}
        </span>
    ));
}

function RankCoordinates({ column }: { column: number }) {
    return Array.from({ length: BOARD_SIZE }, (_, row) => (
        <span
            key={`rank-${column}-${row}`}
            className="coord"
            style={{ gridColumn: column, gridRow: row + 2 }}
        >
            {BOARD_SIZE - row}
        </span>
    ));
}

type SquareProps = {
    square: Square;
    hasKnight: boolean;
    isSelected: boolean;
    isLegalMove: boolean;
    isDragging: boolean;
    isMoving: boolean;
    onClick: () => void;
    onKnightPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onKnightPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onKnightPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onKnightPointerCancel: () => void;
};

function SquareComponent({
    square,
    hasKnight,
    isSelected,
    isLegalMove,
    isDragging,
    isMoving,
    onClick,
    onKnightPointerDown,
    onKnightPointerMove,
    onKnightPointerUp,
    onKnightPointerCancel,
}: SquareProps) {
    const className = [
        "square",
        isLightSquare(square) ? "square--light" : "square--dark",
        hasKnight && isSelected ? "square--selected" : "",
        isLegalMove ? "square--move" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const dragHandlers = hasKnight
        ? {
            onPointerDown: onKnightPointerDown,
            onPointerMove: onKnightPointerMove,
            onPointerUp: onKnightPointerUp,
            onPointerCancel: onKnightPointerCancel,
        }
        : {};

    return (
        <button
            className={className}
            onClick={onClick}
            disabled={isMoving}
            {...dragHandlers}
        >
            {hasKnight && (
                <span
                    className={`knight${isDragging ? " knight--dragging" : ""}`}
                >
                    ♞
                </span>
            )}
            {isLegalMove && <span className="move-dot" aria-hidden="true" />}
        </button>
    );
}

export function Board({ knight, isMoving, onMove, onError }: BoardProps) {
    const [isSelected, setIsSelected] = useState(false);
    const [dragPosition, setDragPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const boardRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragActiveRef = useRef(false);
    const suppressClickRef = useRef(false);

    const isDragging = dragPosition !== null;
    const legalMoves = isSelected && knight ? knightMovesFrom(knight) : [];

    const performMove = async (square: Square) => {
        if (!knight || isMoving) return;

        onError(null);
        const moved = await onMove(square);
        if (moved) setIsSelected(false);
    };

    const handleSquareClick = (square: Square) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }

        if (!knight || isMoving) return;

        if (isSameSquare(square, knight)) {
            return setIsSelected((selected) => !selected);
        }

        if (!legalMoves.some((move) => isSameSquare(move, square))) {
            return onError("Illegal move");
        }

        performMove(square);
    };

    const handleKnightPointerDown = (
        e: React.PointerEvent<HTMLButtonElement>,
    ) => {
        if (isMoving) return;

        suppressClickRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        dragActiveRef.current = false;
        onError(null);
    };

    const handleKnightPointerMove = (
        e: React.PointerEvent<HTMLButtonElement>,
    ) => {
        if (!dragStartRef.current) return;

        if (dragActiveRef.current) {
            setDragPosition({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!knight) return;

        const hovered = squareFromPoint(boardRef.current, e.clientX, e.clientY);
        if (hovered === null || isSameSquare(hovered, knight)) return;

        dragActiveRef.current = true;
        setIsSelected(true);
        setDragPosition({ x: e.clientX, y: e.clientY });
    };

    const handleKnightPointerUp = (
        e: React.PointerEvent<HTMLButtonElement>,
    ) => {
        if (!dragActiveRef.current) return;

        dragActiveRef.current = false;
        dragStartRef.current = null;
        setDragPosition(null);
        suppressClickRef.current = true;

        if (!knight) return;

        const target = squareFromPoint(boardRef.current, e.clientX, e.clientY);

        const legalMove =
            target && legalMoves.some((move) => isSameSquare(move, target));
        if (!legalMove) return onError("Illegal move");
        performMove(target);
    };

    const handleKnightPointerCancel = () => {
        dragStartRef.current = null;
        dragActiveRef.current = false;
        suppressClickRef.current = true;
        setDragPosition(null);
    };

    return (
        <div className="board-frame">
            <FileCoordinates row={1} />
            <FileCoordinates row={10} />
            <RankCoordinates column={1} />
            <RankCoordinates column={10} />

            <div
                className="chess-board"
                role="grid"
                aria-label="Chess board"
                ref={boardRef}
            >
                {allSquares.map((square) => (
                    <SquareComponent
                        key={`${square.row}-${square.col}`}
                        square={square}
                        hasKnight={
                            knight !== null && isSameSquare(square, knight)
                        }
                        isSelected={isSelected}
                        isLegalMove={legalMoves.some((move) =>
                            isSameSquare(move, square),
                        )}
                        isDragging={isDragging}
                        isMoving={isMoving}
                        onClick={() => handleSquareClick(square)}
                        onKnightPointerDown={handleKnightPointerDown}
                        onKnightPointerMove={handleKnightPointerMove}
                        onKnightPointerUp={handleKnightPointerUp}
                        onKnightPointerCancel={handleKnightPointerCancel}
                    />
                ))}
            </div>

            {isDragging && dragPosition && (
                <span
                    className="knight-drag"
                    aria-hidden="true"
                    style={{ left: dragPosition.x, top: dragPosition.y }}
                >
                    ♞
                </span>
            )}
        </div>
    );
}
