"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// Fade in from bottom (for page content)
export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animations
export function StaggerContainer({ children, className = "", staggerDelay = 0.05 }: { children: ReactNode; className?: string; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale in (for cards)
export function ScaleIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide in from side
export function SlideIn({ children, direction = "left", delay = 0, className = "" }: { children: ReactNode; direction?: "left" | "right" | "up" | "down"; delay?: number; className?: string }) {
  const offsets = { left: { x: -30, y: 0 }, right: { x: 30, y: 0 }, up: { x: 0, y: -30 }, down: { x: 0, y: 30 } };
  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated counter (for stats)
export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

// Animate presence wrapper for lists
export function AnimatedList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div layout className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// List item with exit animation
export function AnimatedListItem({ children, id, className = "" }: { children: ReactNode; id: string; className?: string }) {
  return (
    <motion.div
      layout
      key={id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulse effect for live indicators
export function PulseEffect({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Score update animation
export function AnimatedScore({ score, className = "" }: { score: number; className?: string }) {
  return (
    <motion.span
      key={score}
      initial={{ scale: 1.5, color: "#22c55e" }}
      animate={{ scale: 1, color: "inherit" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {score}
    </motion.span>
  );
}
