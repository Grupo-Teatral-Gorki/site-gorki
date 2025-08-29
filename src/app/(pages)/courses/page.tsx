"use client";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSiteDataContext } from "@/context/SiteDataContext";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";

// Função para mapear títulos de cursos para tipos de curso
const getCourseType = (title: string): string => {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("infantil") ||
    lowerTitle.includes("criança") ||
    lowerTitle.includes("kids")
  ) {
    return "infantil";
  } else if (lowerTitle.includes("musical") || lowerTitle.includes("música")) {
    return "musical";
  } else {
    return "adulto"; // padrão para cursos adultos
  }
};

const Cursos = () => {
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
          Cursos
        </h1>
        <div className="w-full max-w-5xl mt-8 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const coursesData = siteData?.courses || [];

  if (coursesData.length === 0) {
    return (
      <motion.div
        className="min-h-screen w-full flex flex-col items-center pt-10 px-2 bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-5xl font-black mb-8 md:mb-16 text-black tracking-tight">
          Cursos
        </h1>
        <p className="text-lg text-gray-700 mb-8 max-w-2xl text-center">
          Descubra nossos cursos disponíveis. Confira abaixo as opções e escolha
          a que mais combina com você!
        </p>
        <div className="w-full max-w-5xl mt-8 flex items-center justify-center py-12">
          <p className="text-gray-600">Nenhum curso disponível no momento.</p>
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
        Cursos
      </h1>
      <p className="text-lg text-gray-700 mb-8 max-w-2xl text-center">
        Descubra nossos cursos disponíveis. Confira abaixo as opções e escolha a
        que mais combina com você!
      </p>
      <div className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {coursesData.map((course) => {
          const courseType = getCourseType(course.title);
          return (
            <Dialog key={course.title}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-shadow">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-56 object-cover rounded-md mb-4"
                  />
                  <h2 className="text-2xl font-semibold mb-2 text-center">
                    {course.title}
                  </h2>
                  <p className="text-gray-700 text-center">
                    {course.description}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{course.title}</DialogTitle>
                  <DialogDescription>{course.description}</DialogDescription>
                </DialogHeader>
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-56 object-cover rounded-md mb-4"
                />
                <p className="mb-4 text-gray-800">{course.details}</p>
                <DialogFooter>
                  <Drawer>
                    <DrawerTrigger asChild>
                      <button className="inline-block px-6 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-700 transition-colors text-center font-semibold">
                        Inscreva-se
                      </button>
                    </DrawerTrigger>
                    <DrawerContent className="max-w-lg ml-auto h-full fixed right-0 top-0 rounded-none rounded-l-2xl shadow-2xl p-0 overflow-y-auto">
                      <DrawerClose className="absolute top-4 right-4 z-10 text-black rounded-full p-2 transition-colors">
                        <span className="text-3xl">&times;</span>
                      </DrawerClose>
                    </DrawerContent>
                  </Drawer>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Cursos;
