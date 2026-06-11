/**
 * @component icon-marquee
 * @intensity cinematic
 * @industry saas, agency, ecom
 * @deps framer-motion
 * @description Infinite scrolling icon/logo strip - antigravity style
 */

"use client";

import { motion } from "framer-motion";

interface IconMarqueeProps {
  items: { icon: React.ReactNode; label: string }[];
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export function IconMarquee({
  items,
  direction = "left",
  speed = "normal",
  className = "",
}: IconMarqueeProps) {
  const speedMap = {
    slow: 60,
    normal: 40,
    fast: 20,
  };

  const duration = speedMap[speed];

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-8 items-center"
        animate={{
          x: direction === "left" ? [0, -50 * items.length + "%"] : [-50 * items.length + "%", 0],
        }}
        transition={{
          x: {
            duration: duration,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 whitespace-nowrap"
          >
            <span className="text-white/80">{item.icon}</span>
            <span className="text-white/60 text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Pre-built icon sets
export const techIcons = [
  { icon: "◈", label: "Next.js" },
  { icon: "◉", label: "React" },
  { icon: "◎", label: "TypeScript" },
  { icon: "◐", label: "Tailwind" },
  { icon: "◑", label: "Node.js" },
  { icon: "◒", label: "PostgreSQL" },
  { icon: "◓", label: "GraphQL" },
  { icon: "◔", label: "Docker" },
];

export const clientIcons = [
  { icon: "★", label: "Fortune 500" },
  { icon: "✦", label: "Startups" },
  { icon: "✹", label: "Agencies" },
  { icon: "✻", label: "Enterprise" },
];
