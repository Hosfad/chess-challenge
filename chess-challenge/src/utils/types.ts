export type Square = {
    row: number;
    col: number;
}

export type GameState = {
    gameId: string;
    knight: Square;
}

export type ChessMove = {
    from: Square;
    to: Square;
};