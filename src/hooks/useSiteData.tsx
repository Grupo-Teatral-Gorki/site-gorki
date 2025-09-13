import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GalleryItem {
  src: string;
  alt: string;
}

interface BannerItem {
  image: string;
  description: string;
  title: string;
}

interface DecorationImage {
  image: string;
  alt: string;
}

interface NextEvent {
  image: string;
  id: string;
  description: string;
  location: string;
  title: string;
  date: string;
  price: string;
}

interface Home {
  banner: BannerItem[];
  decorationImages: DecorationImage;
  nextEvents: NextEvent[];
}

interface HistoryItem {
  alt: string;
  image: string;
  title: string;
  description: string;
}

interface CatalogItem {
  image: string;
  description: string;
  title: string;
}

interface AboutUsItem {
  image: string;
  description: string;
  alt: string;
}

interface CourseItem {
  details: string;
  description: string;
  title: string;
  image: string;
}

interface SiteData {
  id: string;
  gallery: GalleryItem[];
  home: Home;
  history: HistoryItem[];
  catalog: CatalogItem[];
  aboutUs: AboutUsItem[];
  courses: CourseItem[];
}

const SITE_DOC_ID = "AuVrxhdOeARVt6kaWUfG";

export function useSiteData() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSite() {
      // Initialize fallback data first to prevent hydration mismatches
      const fallbackData: Omit<SiteData, "id"> = {
        gallery: [],
        home: {
          banner: [],
          decorationImages: { 
            image: "", 
            alt: "" 
          },
          nextEvents: []
        },
        history: [],
        catalog: [],
        aboutUs: [],
        courses: []
      };

      try {
        const docRef = doc(db, "site", SITE_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSiteData({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SiteData, "id">),
          });
        } else {
          await setDoc(docRef, fallbackData);
          setSiteData({
            id: SITE_DOC_ID,
            ...fallbackData,
          });
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
        console.warn("Firebase failed, using fallback data");
        
        setSiteData({
          id: SITE_DOC_ID,
          ...fallbackData,
        });
      } finally {
        setLoading(false);
      }
    }

    // Only run on client side to prevent hydration issues
    if (typeof window !== 'undefined') {
      fetchSite();
    } else {
      // On server side, set fallback data immediately
      const fallbackData: Omit<SiteData, "id"> = {
        gallery: [],
        home: {
          banner: [],
          decorationImages: { 
            image: "", 
            alt: "" 
          },
          nextEvents: []
        },
        history: [],
        catalog: [],
        aboutUs: [],
        courses: []
      };
      
      setSiteData({
        id: SITE_DOC_ID,
        ...fallbackData,
      });
      setLoading(false);
    }
  }, []);

  // Atualiza o documento no Firestore e o estado local
  async function saveSiteDoc(data: Partial<Omit<SiteData, "id">>) {
    try {
      await setDoc(doc(db, "site", SITE_DOC_ID), data, { merge: true });
      setSiteData((prev) => {
        if (!prev)
          return { id: SITE_DOC_ID, ...(data as Omit<SiteData, "id">) };
        return {
          ...prev,
          ...data,
        };
      });
    } catch (error) {
      console.error("Error saving site data:", error);
      throw error;
    }
  }

  return { siteData, loading, saveSiteDoc };
}
