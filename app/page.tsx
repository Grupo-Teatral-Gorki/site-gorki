import Image from "next/image";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center text-gray-800 p-6 text-center gap-12 mt-10">
      <Image
        src={"https://styxx-public.s3.sa-east-1.amazonaws.com/gorki.png"}
        alt="logo gorki"
        width={400}
        height={200}
      />
      <h1 className="text-4xl font-bold mb-4">🎭 Preparando o Espetáculo 🎭</h1>

      <p className="text-lg mb-6 font-bold">
        Estamos ensaiando os últimos atos. Enquanto isso, fale com a gente nos
        bastidores!
      </p>

      <div className="flex gap-6 justify-center">
        <a
          href="https://wa.me/5516981423000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-2xl transition"
        >
          <FaWhatsapp className="w-5 h-5" />
          WhatsApp
        </a>

        <a
          href="https://instagram.com/grupoteatralgorki"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-2xl transition"
        >
          <FaInstagram className="w-5 h-5" />
          Instagram
        </a>
      </div>
    </div>
  );
}
