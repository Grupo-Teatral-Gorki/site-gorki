"use client";
import React, { useState, useEffect } from "react";
import { useSiteData } from "@/hooks/useSiteData";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import FileUpload from "@/components/FileUpload";

type BannerItem = {
  title: string;
  description: string;
  image: string;
};

type EventItem = {
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  price: string;
  id: string;
};

type DecorationImage = {
  image: string;
  alt: string;
};

type Home = {
  banner: BannerItem[];
  nextEvents: EventItem[];
  decorationImages: DecorationImage;
};

type Course = {
  title: string;
  description: string;
  details: string;
  image: string;
};

type Catalog = {
  title: string;
  description: string;
  image: string;
};

type AboutUs = {
  description: string;
  image: string;
  alt: string;
};

type History = {
  title: string;
  description: string;
  alt: string;
  image: string;
};

type SiteData = {
  home: Home;
  courses: Course[];
  catalog: Catalog[];
  aboutUs: AboutUs[];
  history: History[];
  gallery: { src: string; alt: string }[];
};

const defaultSiteData: SiteData = {
  home: {
    banner: [],
    nextEvents: [],
    decorationImages: { image: "", alt: "" },
  },
  courses: [],
  catalog: [],
  aboutUs: [],
  history: [],
  gallery: [],
};

export default function AdminPage() {
  // Simple password protection
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
  // ...existing code...
      const isAuth = localStorage.getItem("admin-authenticated");
      if (isAuth === "true") {
        setAuthenticated(true);
      }
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Gorki") {
      setAuthenticated(true);
      setError("");
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-authenticated", "true");
      }
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
  };
  const { siteData: firebaseSiteData, loading, saveSiteDoc } = useSiteData();
  const { toast } = useToast();
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);

  // Load data from Firebase when it's available
  useEffect(() => {
    if (firebaseSiteData && !loading) {
      // Ensure all required properties exist with fallbacks
      const safeSiteData: SiteData = {
        home: {
          banner: firebaseSiteData.home?.banner || [],
          nextEvents: firebaseSiteData.home?.nextEvents || [],
          decorationImages: firebaseSiteData.home?.decorationImages || {
            image: "",
            alt: "",
          },
        },
        courses: firebaseSiteData.courses || [],
        catalog: firebaseSiteData.catalog || [],
        aboutUs: firebaseSiteData.aboutUs || [],
        history: firebaseSiteData.history || [],
        gallery: firebaseSiteData.gallery || [],
      };
      setSiteData(safeSiteData);
    }
  }, [firebaseSiteData, loading]);

  // --- Home ---
  const handleHomeChange = <K extends keyof Home, V extends Home[K]>(
    key: K,
    value: V
  ) => {
    setSiteData((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        [key]: value,
      },
    }));
  };

  // --- Courses ---
  const handleCourseChange = (
    idx: number,
    field: keyof Course,
    value: string
  ) => {
    setSiteData((prev) => {
      const courses = (prev.courses || []).map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      );
      return { ...prev, courses };
    });
  };
  const addCourse = () => {
    setSiteData((prev) => ({
      ...prev,
      courses: [
        ...(prev.courses || []),
        { title: "", description: "", details: "", image: "" },
      ],
    }));
  };
  const removeCourse = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      courses: (prev.courses || []).filter((_, i) => i !== idx),
    }));
  };

  // --- Catalog ---
  const handleCatalogChange = (
    idx: number,
    field: keyof Catalog,
    value: string
  ) => {
    setSiteData((prev) => {
      const catalog = (prev.catalog || []).map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      );
      return { ...prev, catalog };
    });
  };
  const addCatalog = () => {
    setSiteData((prev) => ({
      ...prev,
      catalog: [
        ...(prev.catalog || []),
        { title: "", description: "", image: "" },
      ],
    }));
  };
  const removeCatalog = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      catalog: (prev.catalog || []).filter((_, i) => i !== idx),
    }));
  };

  // --- Gallery ---
  const handleGalleryChange = (
    idx: number,
    field: keyof { src: string; alt: string },
    value: string
  ) => {
    setSiteData((prev) => {
      const gallery = (prev.gallery || []).map((g, i) =>
        i === idx ? { ...g, [field]: value } : g
      );
      return { ...prev, gallery };
    });
  };
  const addGallery = () => {
    setSiteData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), { src: "", alt: "" }],
    }));
  };
  const removeGallery = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== idx),
    }));
  };

  // --- AboutUs ---
  const handleAboutUsChange = (
    idx: number,
    field: keyof AboutUs,
    value: string
  ) => {
    setSiteData((prev) => {
      const aboutUs = (prev.aboutUs || []).map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      );
      return { ...prev, aboutUs };
    });
  };
  const addAboutUs = () => {
    setSiteData((prev) => ({
      ...prev,
      aboutUs: [
        ...(prev.aboutUs || []),
        { description: "", image: "", alt: "" },
      ],
    }));
  };
  const removeAboutUs = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      aboutUs: (prev.aboutUs || []).filter((_, i) => i !== idx),
    }));
  };

  // --- History ---
  const handleHistoryChange = (
    idx: number,
    field: keyof History,
    value: string
  ) => {
    setSiteData((prev) => {
      const history = (prev.history || []).map((h, i) =>
        i === idx ? { ...h, [field]: value } : h
      );
      return { ...prev, history };
    });
  };
  const addHistory = () => {
    setSiteData((prev) => ({
      ...prev,
      history: [
        ...(prev.history || []),
        { title: "", description: "", alt: "", image: "" },
      ],
    }));
  };
  const removeHistory = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      history: (prev.history || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSiteUpdate = async () => {
    try {
      await saveSiteDoc(siteData);
      toast({
        title: "Sucesso!",
        description: "Dados salvos com sucesso no Firebase.",
      });
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      toast({
        title: "Erro",
        description:
          "Erro ao salvar dados. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
  };


  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/80">
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-black">Área Restrita</h2>
          <input
            type="password"
            className="border p-2 w-full rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Digite a senha"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            autoFocus
          />
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
  // ...existing code...
                  }
                  placeholder="Selecione a data do evento"
                  className="mb-1"
                />
                <input
                  className="border p-1 w-full mb-1"
                  placeholder="Local"
                  value={item?.location || ""}
                  onChange={(e) =>
                    handleHomeChange(
                      "nextEvents",
                      (siteData.home?.nextEvents || []).map((ev, i) =>
                        i === originalIdx
                          ? { ...ev, location: e.target.value }
                          : ev
                      )
                    )
                  }
                />
                <input
                  className="border p-1 w-full mb-1"
                  placeholder="Preço"
                  value={item?.price || ""}
                  onChange={(e) =>
                    handleHomeChange(
                      "nextEvents",
                      (siteData.home?.nextEvents || []).map((ev, i) =>
                        i === originalIdx
                          ? { ...ev, price: e.target.value }
                          : ev
                      )
                    )
                  }
                />
                <input
                  className="border p-1 w-full mb-1 bg-gray-200 text-gray-600 cursor-not-allowed"
                  placeholder="ID do Evento"
                  value={item?.id || ""}
                  readOnly
                  title="ID gerado automaticamente"
                />
                <FileUpload
                  value={item?.image || ""}
                  onChange={(url) =>
                    handleHomeChange(
                      "nextEvents",
                      (siteData.home?.nextEvents || []).map((ev, i) =>
                        i === originalIdx ? { ...ev, image: url } : ev
                      )
                    )
                  }
                  folder="nextEvents"
                  fileName={`event-${originalIdx}`}
                />
              </div>
            ))}
          <button
            className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
            onClick={() =>
              handleHomeChange("nextEvents", [
                ...(siteData.home?.nextEvents || []),
                {
                  title: "",
                  description: "",
                  date: "",
                  location: "",
                  image: "",
                  price: "",
                  id: crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substr(2, 9),
                },
              ])
            }
          >
            Adicionar Evento
          </button>
        </div>
      </section>
      {/* Courses Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Cursos</h2>
        {(siteData.courses || []).map((course, idx) => (
          <div
            key={idx}
            className="border rounded pt-10 p-2 mb-2 bg-gray-50 relative"
          >
            <button
              className="absolute top-2 right-2 mb-2 text-white bg-red-500 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow"
              title="Remover curso"
              onClick={() => removeCourse(idx)}
            >
              <span className="text-lg font-bold">&times;</span>
            </button>
            <input
              className="border p-1 w-full mb-1"
              placeholder="Título"
              value={course?.title || ""}
              onChange={(e) => handleCourseChange(idx, "title", e.target.value)}
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Descrição"
              value={course?.description || ""}
              onChange={(e) =>
                handleCourseChange(idx, "description", e.target.value)
              }
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Detalhes"
              value={course?.details || ""}
              onChange={(e) =>
                handleCourseChange(idx, "details", e.target.value)
              }
            />
            <FileUpload
              value={course?.image || ""}
              onChange={(url) => handleCourseChange(idx, "image", url)}
              folder="courses"
              fileName={`course-${idx}`}
            />
          </div>
        ))}
        <button
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
          onClick={addCourse}
        >
          Adicionar Curso
        </button>
      </section>
      {/* Catalog Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Catálogo</h2>
        {(siteData.catalog || []).map((item, idx) => (
          <div
            key={idx}
            className="border rounded pt-10 p-2 mb-2 bg-gray-50 relative"
          >
            <button
              className="absolute top-2 right-2 mb-2 text-white bg-red-500 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow"
              title="Remover item do catálogo"
              onClick={() => removeCatalog(idx)}
            >
              <span className="text-lg font-bold">&times;</span>
            </button>
            <input
              className="border p-1 w-full mb-1"
              placeholder="Título"
              value={item?.title || ""}
              onChange={(e) =>
                handleCatalogChange(idx, "title", e.target.value)
              }
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Descrição"
              value={item?.description || ""}
              onChange={(e) =>
                handleCatalogChange(idx, "description", e.target.value)
              }
            />
            <FileUpload
              value={item?.image || ""}
              onChange={(url) => handleCatalogChange(idx, "image", url)}
              folder="catalog"
              fileName={`catalog-${idx}`}
            />
          </div>
        ))}
        <button
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
          onClick={addCatalog}
        >
          Adicionar Item ao Catálogo
        </button>
      </section>
      {/* Gallery Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Galeria de Fotos</h2>
        {(siteData.gallery || []).map((item, idx) => (
          <div
            key={idx}
            className="border rounded pt-10 p-2 mb-2 bg-gray-50 relative"
          >
            <button
              className="absolute top-2 right-2 mb-2 text-white bg-red-500 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow"
              title="Remover foto da galeria"
              onClick={() =>
                setSiteData((prev) => ({
                  ...prev,
                  gallery: (prev.gallery || []).filter((_, i) => i !== idx),
                }))
              }
            >
              <span className="text-lg font-bold">&times;</span>
            </button>
            <FileUpload
              value={item?.src || ""}
              onChange={(url) =>
                setSiteData((prev) => ({
                  ...prev,
                  gallery: (prev.gallery || []).map((img, i) =>
                    i === idx ? { ...img, src: url } : img
                  ),
                }))
              }
              folder="gallery"
              fileName={`gallery-${idx}`}
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Descrição (alt)"
              value={item?.alt || ""}
              onChange={(e) =>
                setSiteData((prev) => ({
                  ...prev,
                  gallery: (prev.gallery || []).map((img, i) =>
                    i === idx ? { ...img, alt: e.target.value } : img
                  ),
                }))
              }
            />
          </div>
        ))}
        <button
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
          onClick={() =>
            setSiteData((prev) => ({
              ...prev,
              gallery: [...(prev.gallery || []), { src: "", alt: "" }],
            }))
          }
        >
          Adicionar Foto à Galeria
        </button>
      </section>
      {/* About Us Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Sobre Nós</h2>
        {(siteData.aboutUs || []).map((item, idx) => (
          <div
            key={idx}
            className="border rounded pt-10 p-2 mb-2 bg-gray-50 relative"
          >
            <button
              className="absolute top-2 right-2 mb-2 text-white bg-red-500 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow"
              title="Remover sobre nós"
              onClick={() => removeAboutUs(idx)}
            >
              <span className="text-lg font-bold">&times;</span>
            </button>
            <input
              className="border p-1 w-full mb-1"
              placeholder="Descrição"
              value={item?.description || ""}
              onChange={(e) =>
                handleAboutUsChange(idx, "description", e.target.value)
              }
            />
            <FileUpload
              value={item?.image || ""}
              onChange={(url) => handleAboutUsChange(idx, "image", url)}
              folder="aboutUs"
              fileName={`aboutus-${idx}`}
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Alt"
              value={item?.alt || ""}
              onChange={(e) => handleAboutUsChange(idx, "alt", e.target.value)}
            />
          </div>
        ))}
        <button
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
          onClick={addAboutUs}
        >
          Adicionar Sobre Nós
        </button>
      </section>
      {/* History Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-2 ">História</h2>
        {(siteData.history || []).map((item, idx) => (
          <div
            key={idx}
            className="border rounded pt-10 p-2 mb-2 bg-gray-50 relative"
          >
            <button
              className="absolute top-2 right-2 mb-2 text-white bg-red-500 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow"
              title="Remover história"
              onClick={() => removeHistory(idx)}
            >
              <span className="text-lg font-bold">&times;</span>
            </button>
            <input
              className="border p-1 w-full mb-1"
              placeholder="Título"
              value={item?.title || ""}
              onChange={(e) =>
                handleHistoryChange(idx, "title", e.target.value)
              }
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Descrição"
              value={item?.description || ""}
              onChange={(e) =>
                handleHistoryChange(idx, "description", e.target.value)
              }
            />
            <input
              className="border p-1 w-full mb-1"
              placeholder="Alt"
              value={item?.alt || ""}
              onChange={(e) => handleHistoryChange(idx, "alt", e.target.value)}
            />
            <FileUpload
              value={item?.image || ""}
              onChange={(url) => handleHistoryChange(idx, "image", url)}
              folder="history"
              fileName={`history-${idx}`}
            />
          </div>
        ))}
        <button
          className="mt-2 px-2 py-1 bg-green-600 text-white rounded"
          onClick={addHistory}
        >
          Adicionar Item à História
        </button>
      </section>
      {/* Save Button */}
      <div className="flex items-center justify-end w-full">
        <div
          className="px-6 py-3 bg-yellow-500 text-black rounded-2xl text-lg text-center font-bold shadow-lg hover:bg-yellow-600 transition-colors border-2 cursor-pointer"
          style={{ minWidth: "120px" }}
          onClick={handleSiteUpdate}
        >
          Salvar
        </div>
      </div>
    </div>
  );
}
