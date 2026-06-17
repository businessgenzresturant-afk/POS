import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gen-Z Restaurant POS — Login",
  description: "Secure login for Gen-Z Restaurant POS System by RAGSPRO Agency",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}