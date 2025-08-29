"use client";
import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { useSiteDataContext } from "@/context/SiteDataContext";

const Gallery = () => {
  const { siteData } = useSiteDataContext();
  const [open, setOpen] = useState(false);
  const [mainIdx, setMainIdx] = useState(0);
  const images = Array.isArray(siteData?.gallery)
    ? siteData.gallery.slice(0, 5)
    : [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-serif text-gray-800 mb-8">
              Galeria de Fotos
            </h2>
            {images.length > 0 && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <div
                    className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
                    onClick={() => {
                      setMainIdx(0);
                      setOpen(true);
                    }}
                  >
                    <img
                      src={images[0]?.src}
                      alt={images[0]?.alt || "Galeria"}
                      className="w-full h-80 object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent
                  className="max-w-4xl w-full flex flex-col md:flex-row items-stretch p-0 bg-transparent border-0 shadow-none"
                  style={{
                    width: "80vw",
                    height: "80vh",
                    maxWidth: "80vw",
                    maxHeight: "80vh",
                  }}
                >
                  <div className="flex-1 flex items-center justify-center bg-black/80 rounded-l-lg h-full">
                    <img
                      src={images[mainIdx]?.src}
                      alt={images[mainIdx]?.alt || "Galeria"}
                      className="w-full h-full object-cover rounded-l-lg"
                      style={{ maxHeight: "100%", maxWidth: "100%" }}
                    />
                  </div>
                  <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 p-4 bg-white rounded-r-lg">
                    {images
                      .filter((_, i) => i !== mainIdx)
                      .slice(0, 4)
                      .map((img, idx2) => (
                        <button
                          key={img.src}
                          className="w-1/4 md:w-full md:h-24 h-16 rounded overflow-hidden border border-gray-200 hover:border-yellow-500 transition-all"
                          onClick={() =>
                            setMainIdx(
                              images.findIndex((im) => im.src === img.src)
                            )
                          }
                          type="button"
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div>
            <h2 className="text-4xl font-serif text-gray-800 mb-8">
              Últimas Notícias
            </h2>
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop"
                alt="Notícias"
                className="w-full h-80 object-cover hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/50 flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Projeto 1</h3>
                  <p className="text-gray-300">
                    Últimas novidades do nosso teatro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
