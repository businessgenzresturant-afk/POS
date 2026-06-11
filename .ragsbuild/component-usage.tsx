"use client";

import { IconMarquee } from "@/app/_components/scroll/icon-marquee";
import { LenisProvider } from "@/app/_components/scroll/lenis-provider";

export default function Page() {
  return (
    <>
// Wrap your app with LenisProvider
<LenisProvider>
  <YourApp />
</LenisProvider>

// Infinite scrolling icons
// Import your icons array
<IconMarquee
  direction="left"
  speed="normal"
/>
    </>
  );
}
