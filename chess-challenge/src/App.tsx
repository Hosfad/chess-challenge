import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
    createGame,
    endGame,
    makeMove,
    safeAwait,
    type Square,
} from "./queries";

const BOARD_SIZE = 8;
const SQUARE_SIZE = 64;

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const KNIGHT_JUMPS = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
];

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
    const style = getComputedStyle(el);
    const borderX = parseFloat(style.borderLeftWidth) || 0;
    const borderY = parseFloat(style.borderTopWidth) || 0;
    const col = Math.floor((clientX - rect.left - borderX) / SQUARE_SIZE);
    const row = Math.floor((clientY - rect.top - borderY) / SQUARE_SIZE);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return null;
    }
    return { row, col };
};

function App() {
    const [gameId, setGameId] = useState<string | null>(null);
    const [knight, setKnight] = useState<Square | null>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const boardRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragActiveRef = useRef(false);
    const suppressClickRef = useRef(false);
    const isDragging = dragPosition !== null;

    const startGame = async () => {
        setError(null);
        const [game, err] = await safeAwait(createGame());
        if (err) {
            return setError(
                err instanceof Error ? err.message : "Could not start a game",
            );
        }

        setGameId(game.gameId);
        setKnight(game.knight);
        setIsSelected(false);
    };

    useEffect(() => {
        startGame();

        const handleBeforeUnload = () => {
            safeAwait(endGame(gameId!));
        };
        // end game if user closes the page
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            // cleanup listeners
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    const legalMoves = isSelected && knight ? knightMovesFrom(knight) : [];

    const performMove = async (square: Square) => {
        if (!knight || !gameId || isMoving) return;

        setIsMoving(true);
        setError(null);
        const [nextKnight, err] = await safeAwait(makeMove(gameId, square));
        setIsMoving(false);
        if (err) {
            return setError(
                err instanceof Error ? err.message : "The move was rejected",
            );
        }
        setKnight(nextKnight);
        setIsSelected(false);
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
            return setError("Illegal move");
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
        setError(null);
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

        if (!legalMove) return setError("Illegal move");
        performMove(target);
    };

    const handleKnightPointerCancel = () => {
        dragStartRef.current = null;
        dragActiveRef.current = false;
        suppressClickRef.current = true;
        setDragPosition(null);
    };

    const allSquares = Array.from(
        { length: BOARD_SIZE * BOARD_SIZE },
        (_, index) => ({
            row: Math.floor(index / BOARD_SIZE),
            col: index % BOARD_SIZE,
        }),
    );

    return (
        <section id="center">
            <div className="board-frame">
                {FILES.map((file, col) => (
                    <span
                        key={`file-top-${file}`}
                        className="coord"
                        style={{ gridColumn: col + 2, gridRow: 1 }}
                    >
                        {file}
                    </span>
                ))}
                {FILES.map((file, col) => (
                    <span
                        key={`file-bottom-${file}`}
                        className="coord"
                        style={{ gridColumn: col + 2, gridRow: 10 }}
                    >
                        {file}
                    </span>
                ))}
                {Array.from({ length: BOARD_SIZE }, (_, row) => (
                    <span
                        key={`rank-left-${row}`}
                        className="coord"
                        style={{ gridColumn: 1, gridRow: row + 2 }}
                    >
                        {BOARD_SIZE - row}
                    </span>
                ))}
                {Array.from({ length: BOARD_SIZE }, (_, row) => (
                    <span
                        key={`rank-right-${row}`}
                        className="coord"
                        style={{ gridColumn: 10, gridRow: row + 2 }}
                    >
                        {BOARD_SIZE - row}
                    </span>
                ))}
                <div
                    className="chess-board"
                    role="grid"
                    aria-label="Chess board"
                    ref={boardRef}
                >
                    {allSquares.map((square) => {
                        const hasKnight =
                            knight !== null && isSameSquare(square, knight);
                        const isLegalMove = legalMoves.some((move) =>
                            isSameSquare(move, square),
                        );

                        const className = [
                            "square",
                            isLightSquare(square)
                                ? "square--light"
                                : "square--dark",
                            hasKnight && isSelected ? "square--selected" : "",
                            isLegalMove ? "square--move" : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        const dragHandlers = hasKnight
                            ? {
                                  onPointerDown: handleKnightPointerDown,
                                  onPointerMove: handleKnightPointerMove,
                                  onPointerUp: handleKnightPointerUp,
                                  onPointerCancel: handleKnightPointerCancel,
                              }
                            : {};

                        return (
                            <button
                                key={`${square.row}-${square.col}`}
                                className={className}
                                onClick={() => handleSquareClick(square)}
                                disabled={isMoving}
                                {...dragHandlers}
                            >
                                {hasKnight && (
                                    <span
                                        className={`knight${
                                            isDragging
                                                ? " knight--dragging"
                                                : ""
                                        }`}
                                    >
                                        ♞
                                    </span>
                                )}
                                {isLegalMove && (
                                    <span
                                        className="move-dot"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
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
            <div className="status">
                {error ? (
                    <span className="status--error">{error}</span>
                ) : (
                    <span aria-hidden="true" />
                )}
                {error && !gameId && (
                    <button className="status--retry" onClick={startGame}>
                        Retry
                    </button>
                )}
            </div>
        </section>
    );
}

export default App;
