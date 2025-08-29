"use client";
import { motion } from "framer-motion";
import { useSiteDataContext } from "@/context/SiteDataContext";

const Historia = () => {
  const { siteData, loading } = useSiteDataContext();

  if (loading) {
    return (
      <motion.div
        className="w-full flex flex-col items-center pt-10 px-2 mb-20 bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold mb-4 text-black">História</h1>
        <div className="max-w-4xl w-full flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const historyData = siteData?.history || [];

  if (historyData.length === 0) {
    return (
      <motion.div
        className="w-full flex flex-col items-center pt-10 px-2 mb-20 bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold mb-4 text-black">História</h1>
        <div className="max-w-4xl w-full flex items-center justify-center py-12">
          <p className="text-gray-600">Nenhum conteúdo disponível.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full flex flex-col items-center pt-10 px-2 mb-20 bg-white"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-4xl font-bold mb-4 text-black">História</h1>
      <div className="max-w-4xl w-full flex flex-col gap-12 items-center">
        {historyData.map((item, index) => (
          <div
            key={item.alt || index}
            className={`flex flex-col md:flex-row items-center gap-8 ${
              index % 2 === 1 ? "md:flex-row-reverse" : ""
            }`}
          >
            <img
              src={item.image}
              alt={item.alt || "History Image"}
              className="w-1/2 max-w-md rounded-lg shadow-lg"
            />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-lg text-gray-700">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Historia;
