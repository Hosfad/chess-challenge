import { useEffect, useState } from "react";
import "./App.css";
import { Board } from "./components/Board";
import { MoveHistory, type Move } from "./components/MoveHistory";
import { StatusBar } from "./components/StatusBar";
import {
    createGame,
    endGame,
    makeMove,
    safeAwait,
    type Square,
} from "./queries";

function App() {
    const [gameId, setGameId] = useState<string | null>(null);
    const [knight, setKnight] = useState<Square | null>(null);
    const [moves, setMoves] = useState<Move[]>([]);
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
        setMoves([]);
    };

    useEffect(() => {
        startGame();

        const handleBeforeUnload = () => {
            safeAwait(endGame(gameId!));
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            handleBeforeUnload();
        };
    }, []);

    const performMove = async (square: Square): Promise<boolean> => {
        if (!gameId || !knight || isMoving) return false;

        setIsMoving(true);
        setError(null);
        const [nextKnight, err] = await safeAwait(makeMove(gameId, square));
        setIsMoving(false);

        if (err) {
            setError(
                err instanceof Error ? err.message : "The move was rejected",
            );
            return false;
        }

        setKnight(nextKnight);
        setMoves((previous) => [...previous, { from: knight, to: square }].slice(-10));
        return true;
    };

    return (
        <section id="center">
            <MoveHistory moves={moves} />
            <Board
                knight={knight}
                isMoving={isMoving}
                onMove={performMove}
                onError={setError}
            />
            <StatusBar
                error={error}
                hasGame={gameId !== null}
                onRetry={startGame}
            />
        </section>
    );
}

export default App;