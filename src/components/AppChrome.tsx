"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith("/desventuras");

  return (
    <>
      {!hideChrome && <Header />}
      <main className={hideChrome ? "" : "pt-16"}>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
