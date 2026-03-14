'use client';

/**
 * Reusable Framer Motion entrance animation wrappers.
 * All honour prefers-reduced-motion via Framer's built-in support.
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const ease = [0.16, 1, 0.3, 1] as const;

const fadeInUpVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease, delay },
  }),
};

const staggerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerItemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const viewportOpts = { once: true, amount: 0.12, margin: '-50px' } as const;

/** Single element that fades + slides up when scrolled into view. */
export function FadeInUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOpts}
      custom={delay}
      variants={fadeInUpVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered container — wrap a list of StaggerItem children. */
export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOpts}
      variants={staggerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual item inside StaggerList. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
