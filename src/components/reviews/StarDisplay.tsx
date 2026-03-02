interface Props {
  rating: number;
  size?: 'sm' | 'md';
  showNumber?: boolean;
  count?: number;
}

export default function StarDisplay({ rating, size = 'md', showNumber = false, count }: Props) {
  const px = size === 'sm' ? 14 : 18;
  const floor = Math.floor(rating);
  const frac = rating - floor;

  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < floor;
        const half = !filled && i === floor && frac >= 0.5;

        return (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width={px}
            height={px}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={filled ? 'text-amber-400' : half ? 'text-amber-400' : 'text-gray-300'}
          >
            {half ? (
              <>
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  fill={`url(#half-${i})`}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        );
      })}
      {showNumber && (
        <span className="ms-1 text-sm font-medium text-text-primary">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="ms-0.5 text-sm text-text-muted">({count})</span>
      )}
    </span>
  );
}
