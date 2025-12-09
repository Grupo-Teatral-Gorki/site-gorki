"use client";
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useSiteData } from "@/hooks/useSiteData";
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
  priceInteira?: string;
  priceMeia?: string;
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
  // Authentication state
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  // Firebase hooks
  const { siteData: firebaseSiteData, loading, saveSiteDoc } = useSiteData();
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("admin-authenticated");
      if (isAuth === "true") {
        setAuthenticated(true);
      }
    }
  }, []);

  // Load data from Firebase when available
  useEffect(() => {
    if (firebaseSiteData && !loading) {
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

  // Home handlers
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

  // Course handlers
  const handleCourseChange = (idx: number, field: keyof Course, value: string) => {
    setSiteData((prev) => ({
      ...prev,
      courses: prev.courses.map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addCourse = () => {
    setSiteData((prev) => ({
      ...prev,
      courses: [
        ...prev.courses,
        { title: "", description: "", details: "", image: "" },
      ],
    }));
  };

  const removeCourse = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== idx),
    }));
  };

  // Event handlers
  const handleEventChange = (idx: number, field: keyof EventItem, value: string) => {
    let formattedValue = value;

    // Format price fields to ensure dot decimal format when saving
    if (field === 'priceInteira' || field === 'priceMeia') {
      formattedValue = value.replace(',', '.');
    }

    setSiteData((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        nextEvents: prev.home.nextEvents.map((e, i) =>
          i === idx ? { ...e, [field]: formattedValue } : e
        ),
      },
    }));
  };

  const addEvent = () => {
    setSiteData((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        nextEvents: [
          ...prev.home.nextEvents,
          {
            title: "",
            description: "",
            date: "",
            location: "",
            image: "",
            price: "",
            priceInteira: "",
            priceMeia: "",
            id: `event-${Date.now()}`
          },
        ],
      },
    }));
  };

  const removeEvent = (idx: number) => {
    setSiteData((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        nextEvents: prev.home.nextEvents.filter((_, i) => i !== idx),
      },
    }));
  };

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    banners: true,
    events: false,
    courses: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Save function
  const handleSiteUpdate = async () => {
    try {
      await saveSiteDoc(siteData);
      console.log("Dados salvos com sucesso no Firebase.");
      alert("Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados. Verifique o console para mais detalhes.");
    }
  };

  // Generate sample tickets for support/testing
  const handleGenerateSampleTickets = async () => {
    try {
      const res = await fetch('/api/test-tickets', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        alert(`Erro ao gerar ingressos de teste: ${json?.error || res.status}`);
        return;
      }
      const paymentId = json.paymentId || 'desconhecido';

      // Fetch tickets for this payment
      const tRes = await fetch(`/api/tickets/${paymentId}`, { cache: 'no-store' });
      if (!tRes.ok) {
        alert(`Ingressos criados, mas não foi possível carregar a lista (status ${tRes.status}).`);
        return;
      }
      const tJson = await tRes.json();
      const tickets = tJson.tickets || [];

      // Generate QR codes data URLs
      const qrCodes: Record<string, string> = {};
      for (const t of tickets) {
        const validationUrl = `${window.location.origin}/validate/${t.ticketId}`;
        qrCodes[t.ticketId] = await QRCode.toDataURL(validationUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
      }

      // Ask server to generate a PDF with the QR codes and download automatically
      const pdfRes = await fetch('/api/tickets/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets, qrCodes })
      });
      if (!pdfRes.ok) {
        alert('Ingressos criados, mas houve erro ao gerar o PDF.');
        return;
      }
      const blob = await pdfRes.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ingressos-teste-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`Ingressos de teste criados! O PDF com os QR Codes foi baixado.\nPayment ID: ${paymentId}\nTotal: ${tickets.length}`);
    } catch (e) {
      console.error('Erro ao gerar ingressos de teste', e);
      alert('Erro ao gerar ingressos de teste. Veja o console para detalhes.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Área Restrita</h2>
            <p className="text-gray-600">Digite a senha para acessar o painel administrativo</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-foreground bg-background dark:border-gray-600"
                placeholder="Digite a senha"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-600 mt-2">Gerencie o conteúdo do site Gorki</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateSampleTickets}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="Gerar ingressos de teste"
                >
                  Gerar Ingressos de Teste
                </button>
                <a
                  href="/admin/payments"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Pagamentos
                </a>
                <a
                  href="/admin/generate-tickets"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gerar Ingressos (Suporte)
                </a>
                <a
                  href="/admin/reports/attendees"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Relatório de Participantes
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem("admin-authenticated");
                    setAuthenticated(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Home - Banner Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('banners')}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Home - Banner</h2>
                <p className="text-sm text-gray-600 mt-1">Configure os banners da página inicial</p>
              </div>
              <div className={`transform transition-transform ${openSections.banners ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openSections.banners && (
              <div className="border-t border-gray-200 p-6">
                <div className="space-y-6">
                  {siteData.home.banner.map((banner, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-6 relative">
                      <button
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        title="Remover banner"
                        onClick={() =>
                          handleHomeChange(
                            "banner",
                            siteData.home.banner.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <span className="text-xl font-bold">&times;</span>
                      </button>

                      <div className="space-y-4 pr-12">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título
                          </label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite o título do banner"
                            value={banner.title}
                            onChange={(e) =>
                              handleHomeChange(
                                "banner",
                                siteData.home.banner.map((b, i) =>
                                  i === idx ? { ...b, title: e.target.value } : b
                                )
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite a descrição do banner"
                            rows={3}
                            value={banner.description}
                            onChange={(e) =>
                              handleHomeChange(
                                "banner",
                                siteData.home.banner.map((b, i) =>
                                  i === idx ? { ...b, description: e.target.value } : b
                                )
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagem
                          </label>
                          <FileUpload
                            value={banner.image}
                            onChange={(url) =>
                              handleHomeChange(
                                "banner",
                                siteData.home.banner.map((b, i) =>
                                  i === idx ? { ...b, image: url } : b
                                )
                              )
                            }
                            folder="banner"
                            fileName={`banner-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() =>
                      handleHomeChange("banner", [
                        ...siteData.home.banner,
                        { title: "", description: "", image: "" },
                      ])
                    }
                  >
                    <span className="text-lg">+</span>
                    Adicionar Banner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('events')}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Próximos Eventos</h2>
                <p className="text-sm text-gray-600 mt-1">Configure os eventos da página inicial</p>
              </div>
              <div className={`transform transition-transform ${openSections.events ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openSections.events && (
              <div className="border-t border-gray-200 p-6">
                <div className="space-y-6">
                  {siteData.home.nextEvents.map((event, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-6 relative">
                      <button
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        title="Remover evento"
                        onClick={() => removeEvent(idx)}
                      >
                        <span className="text-xl font-bold">&times;</span>
                      </button>

                      <div className="space-y-4 pr-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Título
                            </label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                              placeholder="Digite o título do evento"
                              value={event.title}
                              onChange={(e) => handleEventChange(idx, "title", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data
                            </label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                              value={event.date}
                              onChange={(e) => handleEventChange(idx, "date", e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Local
                          </label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite o local do evento"
                            value={event.location}
                            onChange={(e) => handleEventChange(idx, "location", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preço (Legado)
                            </label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                              placeholder="Ex: R$ 50,00 ou Gratuito"
                              value={event.price}
                              onChange={(e) => handleEventChange(idx, "price", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Usado para compatibilidade</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preço Inteira
                            </label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                              placeholder="Ex: 50.00"
                              value={event.priceInteira || ""}
                              onChange={(e) => handleEventChange(idx, "priceInteira", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Valor em reais (sem R$)</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preço Meia
                            </label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                              placeholder="Ex: 25.00"
                              value={event.priceMeia || ""}
                              onChange={(e) => handleEventChange(idx, "priceMeia", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Valor em reais (sem R$)</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite a descrição do evento"
                            rows={3}
                            value={event.description}
                            onChange={(e) => handleEventChange(idx, "description", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagem
                          </label>
                          <FileUpload
                            value={event.image}
                            onChange={(url) => handleEventChange(idx, "image", url)}
                            folder="events"
                            fileName={`event-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={addEvent}
                  >
                    <span className="text-lg">+</span>
                    Adicionar Evento
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Courses Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('courses')}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Cursos</h2>
                <p className="text-sm text-gray-600 mt-1">Gerencie os cursos oferecidos</p>
              </div>
              <div className={`transform transition-transform ${openSections.courses ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openSections.courses && (
              <div className="border-t border-gray-200 p-6">
                <div className="space-y-6">
                  {siteData.courses.map((course, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-6 relative">
                      <button
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        title="Remover curso"
                        onClick={() => removeCourse(idx)}
                      >
                        <span className="text-xl font-bold">&times;</span>
                      </button>

                      <div className="space-y-4 pr-12">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título
                          </label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite o título do curso"
                            value={course.title}
                            onChange={(e) => handleCourseChange(idx, "title", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite a descrição do curso"
                            rows={3}
                            value={course.description}
                            onChange={(e) => handleCourseChange(idx, "description", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detalhes
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground bg-background dark:border-gray-600"
                            placeholder="Digite os detalhes do curso"
                            rows={2}
                            value={course.details}
                            onChange={(e) => handleCourseChange(idx, "details", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagem
                          </label>
                          <FileUpload
                            value={course.image}
                            onChange={(url) => handleCourseChange(idx, "image", url)}
                            folder="courses"
                            fileName={`course-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={addCourse}
                  >
                    <span className="text-lg">+</span>
                    Adicionar Curso
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSiteUpdate}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
