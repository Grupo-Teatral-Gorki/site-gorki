"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Hero from "../components/Hero";
import UpcomingEvents from "../components/UpcomingEvents";
import ImageSection from "../components/ImageSection";
import Gallery from "../components/Gallery";
import { motion } from "framer-motion";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to casa-fechada event page
    router.push("/eventos/casa-fechada");
  }, [router]);

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Hero />
      <UpcomingEvents />
      <ImageSection />
      <Gallery />
    </motion.div>
  );
};

export default Index;
