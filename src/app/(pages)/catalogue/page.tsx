"use client";
import { motion } from "framer-motion";
import { useSiteDataContext } from "@/context/SiteDataContext";
import Image from "next/image";

const ShowItem = ({
  item,
}: {
  item: { title: string; image: string; description: string };
}) => (
  <>
    <Image
      src={item.image}
      alt={item.title}
      width={800}
      height={420}
      className="w-full h-56 sm:h-72 md:h-[420px] object-cover object-center rounded-xl md:rounded-3xl shadow-xl group-hover:grayscale transition-all duration-500"
      style={{ width: "100%", height: "auto" }}
      sizes="(max-width: 768px) 100vw, 800px"
      loading="lazy"
    />
    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 sm:bottom-4 md:bottom-8 w-[95%] sm:w-4/5 md:w-2/3 bg-white/90 md:bg-white/70 backdrop-blur-md rounded-lg md:rounded-2xl shadow-2xl p-3 sm:p-5 md:p-8 flex flex-col items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 translate-y-0 md:translate-y-8 transition-all duration-500 max-h-[90%]">
      <h3 className="text-lg sm:text-xl md:text-3xl font-extrabold text-black mb-1 sm:mb-2 tracking-tight text-center drop-shadow-lg">
        {item.title}
      </h3>
      <div className="w-full overflow-y-auto max-h-40 md:max-h-60 custom-scrollbar">
        <p className="text-xs sm:text-base md:text-lg text-black/80 text-center font-medium drop-shadow">
          {item.description}
        </p>
      </div>
    </div>
  </>
);

const Catalogo = () => {
  const { siteData, loading } = useSiteDataContext();

  if (loading) {
    return (
      <motion.div
        className="min-h-screen w-full flex flex-col items-center pt-10 px-2 bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-5xl font-black mb-8 md:mb-16 text-black tracking-tight">
          Catálogo
        </h1>
        <div className="w-full max-w-6xl flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const catalogData = siteData?.catalog || [];

  if (catalogData.length === 0) {
    return (
      <motion.div
        className="min-h-screen w-full flex flex-col items-center pt-10 px-2 bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-5xl font-black mb-8 md:mb-16 text-black tracking-tight">
          Catálogo
        </h1>
        <div className="w-full max-w-6xl flex items-center justify-center py-12">
          <p className="text-gray-600">Nenhum conteúdo disponível.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col items-center pt-10 px-2 bg-white"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-3xl md:text-5xl font-black mb-8 md:mb-16 text-black tracking-tight">
        Catálogo
      </h1>
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {catalogData.map((item) => (
            <ShowItem key={item.title} item={item} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Catalogo;
