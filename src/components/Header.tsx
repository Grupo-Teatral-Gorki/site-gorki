"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import logobranco from "../assets/logobranco.png";

const Header = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Cursos", href: "/courses" },
    { label: "Catálogo", href: "/catalogue" },
    { label: "Sobre nós", href: "/aboutus" },
    { label: "Gestão de Cultura", href: "/criarte" },
    { label: "História", href: "/history" },
  ];

  return (
    <header className="fixed top-0 w-full flex items-center justify-center bg-black/90 backdrop-blur-3xl z-50 py-4">
      <div className="container flex gap-8 items-center justify-center">
        <div className="flex-shrink-0">
          <Link href="/" passHref>
            <Image
              src={logobranco}
              alt="logo"
              className="h-14 w-auto cursor-pointer"
              loading="lazy"
            />
          </Link>
        </div>
        <nav className="hidden md:flex space-x-8 whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium tracking-wide border-b-2 pb-1 transition-colors duration-200 ${
                  isActive
                    ? "text-yellow-400 border-yellow-400"
                    : "text-gray-300 hover:text-yellow-400 border-transparent hover:border-yellow-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
