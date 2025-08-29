import { useSiteDataContext } from "@/context/SiteDataContext";

const ImageSection = () => {
  const { siteData, loading } = useSiteDataContext();

  if (loading) {
    return (
      <section className="py-0">
        <div className="relative h-96 md:h-[500px] bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </section>
    );
  }

  const decorationImage = siteData?.home?.decorationImages;

  if (!decorationImage?.image) {
    return null;
  }

  return (
    <section className="py-0">
      <div className="relative h-96 md:h-[500px]">
        <img
          src={decorationImage.image}
          alt={decorationImage.alt || "Decoration Image"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
    </section>
  );
};

export default ImageSection;
