import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Eventos - Grupo Teatral Gorki",
  description: "Compre ingressos para os eventos do Grupo Teatral Gorki",
};

export default function EventosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="antialiased bg-[#0a0a0a] text-black min-h-screen flex items-start justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1200px] ">{children}</div>
    </div>
  );
}
