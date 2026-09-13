type StatusBarProps = {
    error: string | null;
    hasGame: boolean;
    onRetry: () => void;
};

export function StatusBar({ error, hasGame, onRetry }: StatusBarProps) {
    return (
        <div className="status">
            {error ? (
                <span className="status--error">{error}</span>
            ) : (
                <span aria-hidden="true" />
            )}
            {error && !hasGame && (
                <button className="status--retry" onClick={onRetry}>
                    Retry
                </button>
            )}
        </div>
    );
}