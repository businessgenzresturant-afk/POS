export const metadata = {
  title: "Marketing",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  );
}
