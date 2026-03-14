interface Props {
  pre: string;
  accent: string;
  post: string;
}

/**
 * Hero title with accent-coloured key phrase.
 * Each word group slides up and fades in on load, staggered.
 */
export default function HeroTitleHighlight({ pre, accent, post }: Props) {
  return (
    <>
      <span className="inline-block opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.1s_forwards]">{pre}</span>
      {' '}
      <span className="inline-block text-accent opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.25s_forwards]">{accent}</span>
      {' '}
      <span className="inline-block opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.4s_forwards]">{post}</span>
    </>
  );
}
