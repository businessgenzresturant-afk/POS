import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gen-Z POS - Auth",
  description: "Authentication for Restaurant POS System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        {children}
      </div>
    </div>
  );
}