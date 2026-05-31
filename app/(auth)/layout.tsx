import { Footer } from "@/components/shared/footer";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
