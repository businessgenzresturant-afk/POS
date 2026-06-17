'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden px-6">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center max-w-md z-10 space-y-6">
        {/* Glowing 404 badge */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 text-5xl mb-2 shadow-lg shadow-primary/5 ">
          🛸
        </div>
        
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tighter text-foreground bg-clip-text bg-gradient-to-b from-foreground to-foreground/40 leading-none">
            404
          </h1>
          <h2 className="text-2xl font-black text-foreground">Lost in Space?</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved to another coordinate.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" passHref>
            <Button variant="gradient" className="bg-gradient-to-r from-orange-600 to-amber-600 font-bold px-8 py-3 h-12 rounded-xl shadow-lg shadow-orange-500/20 w-full sm:w-auto">
              🛸 Go to Dashboard
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="font-bold px-8 py-3 h-12 rounded-xl border-border hover:bg-muted w-full sm:w-auto"
          >
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
