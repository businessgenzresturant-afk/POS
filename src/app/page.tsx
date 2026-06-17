import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Hero Section */}
      <section className="py-20 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="mb-6 text-4xl font-bold text-foreground">
            Gen-Z POS
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Restaurant Point of Sale System - Free after setup
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all transform hover:-scale-[102%]"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border border-orange-300 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 hover:shadow-md transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="mb-12 text-3xl font-bold text-center text-foreground">
            Why Choose Gen-Z POS?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-center">
            <div className="p-6 bg-muted/50 rounded-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Complete Restaurant Management</h3>
              <p className="text-sm text-muted-foreground">
                Tables, orders, menu, kitchen, billing & reports in one system
              </p>
            </div>
            <div className="p-6 bg-muted/50 rounded-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">One-Time Setup Fee</h3>
              <p className="text-sm text-muted-foreground">
                Pay once for setup &amp; temporary maintenance, then use FREE forever
              </p>
            </div>
            <div className="p-6 bg-muted/50 rounded-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 4.567 2.836 8.442 6.764 9.867a11.925 11.925 0 00-2.514 1.07A5.976 5.976 0 000 18c0 .395.049.78.148 1.148a5.747 5.747 0 004.413 1.5 11.955 11.955 0 016.764 1.008c4.731 0 8.582-3.15 9.823-7.382.253-.42.39-.859.39-1.308V6.725a5.976 5.976 0 00-1.18-1.772z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No Monthly Fees</h3>
              <p className="text-sm text-muted-foreground">
                Save ₹50,000+/year compared to monthly subscription systems
              </p>
            </div>
            <div className="p-6 bg-muted/50 rounded-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12a3 3 0 003 3h10a3 3 0 003-3V9a3 3 0 00-3-3H5a3 3 0 00-3 3v3zm-1.418-8.508a6.002 6.002 0 01-.801 11.886A5.988 5.988 0 009 18h6a5.988 5.988 0 005.988-4.114M15 9a6 6 0 010 12M4.5 9a6 6 0 000 12" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Modern &amp; Fast</h3>
              <p className="text-sm text-muted-foreground">
                Built with Next.js 14, TypeScript, Prisma &amp; Supabase for performance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="mb-12 text-3xl font-bold text-center text-foreground">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center bg-primary/10 rounded-lg mx-auto">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M6 6l6 6 6-6" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">1. Setup &amp; Configuration</h3>
              <p className="text-sm text-muted-foreground">
                We set up your restaurant POS system with your menu, tables &amp; preferences
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center bg-primary/10 rounded-lg mx-auto">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0h.01M15 12h6m-6 0h.01M12 18V6m0 0l3-3-3-3" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">2. Training &amp; Support</h3>
              <p className="text-sm text-muted-foreground">
                Staff training &amp; 3 months of technical support included
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center bg-primary/10 rounded-lg mx-auto">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">3. Use FREE Forever</h3>
              <p className="text-sm text-muted-foreground">
                No monthly fees - own your POS system outright after setup period
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="mb-8 text-3xl font-bold text-foreground">
            Ready to transform your restaurant operations?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Join 100+ restaurants using Gen-Z POS to increase efficiency &amp; profits
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link
              href="/login"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all transform hover:-scale-[102%]"
            >
              Login to Demo
            </Link>
            <Link
              href="/register"
              className="flex-1 px-8 py-4 border border-orange-300 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 hover:shadow-md transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Gen-Z POS. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by <a href="https://genzpos.com" className="text-orange-600 hover:underline">Gen-Z</a>
          </p>
        </div>
      </footer>
    </div>
  );
}