import Image from 'next/image';

/**
 * Hero graphic: photo with a delicate offset background frame and gold corner accent.
 * Pure decorative — aria-hidden.
 */
export default function HeroGraphic() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[340px] w-full max-w-[380px] select-none lg:h-[440px] lg:max-w-[480px]"
    >
      {/* Offset background frame — subtle depth */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-primary-light" />

      {/* Small gold corner accent — bottom-end */}
      <div className="absolute -bottom-2 -end-2 h-10 w-10 rounded-xl bg-accent/30" />

      {/* Thin gold line accent — top-start edge */}
      <div className="absolute -start-1 top-8 h-16 w-0.5 rounded-full bg-accent/50" />

      {/* Photo */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-border">
        <Image
          src="/hero-1.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 0px, 480px"
        />
      </div>
    </div>
  );
}
