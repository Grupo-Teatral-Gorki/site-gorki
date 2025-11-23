import React from "react";
import { Instagram, MapPin } from "lucide-react";
import Image from "next/image";
import logobranco from "../assets/logobranco.png";

const Footer = () => {
  const links = [
    "Cursos",
    "Catálogo",
    "Sobre nós",
    "Gestão de Cultura",
    "Notícias",
  ];

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Contato</h3>
            <div className="flex items-center space-x-2 mb-4">
              {/* WhatsApp logo SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-yellow-400"
                aria-hidden="true"
              >
                <path d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.5 0 .18 5.33.18 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.73a11.85 11.85 0 0 0 5.74 1.5h.01c6.56 0 11.89-5.33 11.89-11.9 0-3.18-1.24-6.17-3.44-8.39ZM12.07 21.3h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.75 1.03 1-3.65-.24-.38a9.77 9.77 0 0 1-1.5-5.21c0-5.4 4.4-9.8 9.81-9.8 2.62 0 5.09 1.02 6.95 2.88a9.75 9.75 0 0 1 2.86 6.93c0 5.4-4.4 9.8-9.77 9.8Zm5.55-7.3c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.95-.95 1.15-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.8-1.67-2.1-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.61-.9-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.48.71.31 1.27.5 1.7.64.72.23 1.38.2 1.9.12.58-.09 1.75-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
              </svg>
              <a
                href="https://wa.me/5516981423000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                aria-label="WhatsApp"
              >
                WhatsApp: +55 16 98142-3000
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Links</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Siga a gente:</h3>
            <div className="flex items-center space-x-2">
              <Instagram size={24} className="text-yellow-400" />
              <a
                href="https://instagram.com/grupoteatralgorki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                @grupoteatralgorki
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center flex items-end justify-center gap-4">
          <Image src={logobranco} alt="logo" className="h-16" width={120} height={64} />
          <p className="text-gray-500">
            © {new Date().getFullYear()} Grupo Teatral GORKI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
