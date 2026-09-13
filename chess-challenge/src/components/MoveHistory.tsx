import { useEffect, useRef } from "react";
import type { Square } from "../queries";

const BOARD_SIZE = 8;
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const SCROLL_STEP = 140;

export type Move = {
    from: Square;
    to: Square;
};

const toNotation = ({ row, col }: Square) => `${FILES[col]}${BOARD_SIZE - row}`;

type MoveHistoryProps = {
    moves: Move[];
};

export function MoveHistory({ moves }: MoveHistoryProps) {
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = listRef.current;
        // scroll to the end of the list when an item is added
        if (el && moves.length > 0) {
            el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
        }
    }, [moves.length]);

    const scroll = (direction: 1 | -1) => {
        listRef.current?.scrollBy({
            left: direction * SCROLL_STEP,
            behavior: "smooth",
        });
    };

    return (
        <div className="move-history">
            <button
                type="button"
                className="move-history__nav"
                aria-label="Scroll to older moves"
                onClick={() => scroll(-1)}
            >
                ‹
            </button>

            <div className="move-history__list" ref={listRef}>
                {moves.map((move, index) => (
                    <span
                        key={index}
                        className={`move-history__move${
                            index === moves.length - 1
                                ? " move-history__move--latest"
                                : ""
                        }`}
                    >
                        <span className="move-history__index">
                            {index + 1}.
                        </span>
                        {toNotation(move.from)}
                        <span
                            className="move-history__arrow"
                            aria-hidden="true"
                        >
                            →
                        </span>
                        {toNotation(move.to)}
                    </span>
                ))}
            </div>

            <button
                type="button"
                className="move-history__nav"
                aria-label="Scroll to newer moves"
                onClick={() => scroll(1)}
            >
                ›
            </button>
        </div>
    );
}
