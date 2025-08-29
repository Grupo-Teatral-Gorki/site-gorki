"use client";
import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";

export type MosaicImage = {
  src: string;
  alt: string;
  href?: string;
};

interface MosaicProps {
  images: MosaicImage[];
}

export const Mosaic: FC<MosaicProps> = ({ images }) => {
  // Only use the first 3 images for this layout
  const [activeIdx, setActiveIdx] = useState(0);
  const mosaicImages = images.slice(0, 3);

  // Arrange: active image left, others right (top/bottom)
  const leftImage = mosaicImages[activeIdx];
  const rightImages = mosaicImages.filter((_, i) => i !== activeIdx);

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 max-w-3xl mx-auto min-h-[400px]">
      {/* Left: Large image (row-span-2) */}
      <motion.div
        key={leftImage.src}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="row-span-2 col-span-1 h-full"
        style={{ minHeight: 0 }}
      >
        <Card className="h-full w-full overflow-hidden cursor-pointer">
          <AspectRatio ratio={4 / 5} className="h-full w-full">
            <img
              src={leftImage.src}
              alt={leftImage.alt}
              className="object-fill w-full h-full transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </AspectRatio>
        </Card>
      </motion.div>
      {/* Right: Two stacked images */}
      {rightImages.map((img, i) => (
        <motion.div
          key={img.src}
          layout
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="col-span-1 row-span-1 h-full"
          style={{ minHeight: 0 }}
          onClick={() => setActiveIdx(images.indexOf(img))}
          whileHover={{ scale: 1.04 }}
        >
          <Card className="h-full w-full overflow-hidden cursor-pointer">
            <AspectRatio ratio={4 / 3} className="h-full w-full">
              <img
                src={img.src}
                alt={img.alt}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </AspectRatio>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default Mosaic;
