import { useEffect, useState } from "react";
import "./App.css";
import {
    createGame,
    endGame,
    makeMove,
    safeAwait,
    type Square,
} from "./queries";

const BOARD_SIZE = 8;

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

function App() {
    const [gameId, setGameId] = useState<string | null>(null);
    const [knight, setKnight] = useState<Square | null>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        if (!gameId) return;

        startGame();

        const handleBeforeUnload = () => {
            safeAwait(endGame(gameId!));
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            handleBeforeUnload();
        };
    }, [gameId]);

    const legalMoves = isSelected && knight ? knightMovesFrom(knight) : [];

    const handleSquareClick = async (square: Square) => {
        if (!knight || !gameId || isMoving) return;

        if (isSameSquare(square, knight)) {
            return setIsSelected((selected) => !selected);
        }

        if (!legalMoves.some((move) => isSameSquare(move, square))) {
            return setError("Illegal move");
        }

        setIsMoving(true);
        setError(null);
        const [nextKnight, err] = await safeAwait(makeMove(gameId, square));
        if (err) {
            setError(
                err instanceof Error ? err.message : "The move was rejected",
            );
        } else {
            setKnight(nextKnight);
            setIsSelected(false);
        }
        setIsMoving(false);
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
            <div className="chess-board" role="grid" aria-label="Chess board">
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

                    return (
                        <button
                            key={`${square.row}-${square.col}`}
                            className={className}
                            onClick={() => handleSquareClick(square)}
                            disabled={isMoving}
                        >
                            {hasKnight && <span className="knight">♞</span>}
                            {isLegalMove && (
                                <span className="move-dot" aria-hidden="true" />
                            )}
                        </button>
                    );
                })}
            </div>
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
