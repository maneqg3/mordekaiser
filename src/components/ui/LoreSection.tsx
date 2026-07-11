import type { ReactNode } from 'react';

type Act = 'i' | 'ii' | 'iii' | 'iv';

type Props = {
  act: Act;
  headingId: string;
  kicker: string;
  title: string;
  body: string[];
  className?: string;
  children?: ReactNode;
};

export function LoreSection({
  act,
  headingId,
  kicker,
  title,
  body,
  className,
  children,
}: Props) {
  return (
    <section
      data-act={act}
      aria-labelledby={headingId}
      className={`act-section ${className ?? ''}`}
    >
      <div className="reveal relative mx-auto flex max-w-prose flex-col gap-6">
        <p className="act-kicker">{kicker}</p>
        <h2 id={headingId} className="type-blackletter text-4xl sm:text-5xl">
          {title}
        </h2>
        {body.map((paragraph) => (
          <p key={paragraph} className="opacity-90">
            {paragraph}
          </p>
        ))}
        {children}
      </div>
    </section>
  );
}
