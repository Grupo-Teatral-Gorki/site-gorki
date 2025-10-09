"use client";
import { useState, useMemo } from "react";
import MercadoPagoPayment from "@/components/MercadoPagoPayment";
import Image from "next/image";

const EVENT = {
  id: "desventuras-001",
  title: "Desventuras de Maria",
  date: "08-10-2025",
  location: "Teatro Municipal de Ribeirão Preto",
  image: "https://firebasestorage.googleapis.com/v0/b/itapevi-cce4e.firebasestorage.app/o/WhatsApp%20Image%202025-09-30%20at%2017.40.58.jpeg?alt=media&token=67add5bd-893c-49fc-86ef-287e1040f83a",
  // Preços em string no formato já usado no site
  price: "R$ 00,00",
  priceInteira: "40.00",
  priceMeia: "20.00",
  release: "Em meio a sonhos, memórias e fantasias, Desventuras de Maria acompanha a jornada de uma menina de 12 anos em busca de si mesma. Pressionada pelas expectativas do mundo ao seu redor, Maria embarca em mais uma aventura de escoteira com Bitu, seu amigo imaginário, que a guia por desafios e descobertas sobre o bem, o mal e tudo que há entre eles. Inspirado na obra e no legado de Maria Clara Machado, o espetáculo infantil musical explora a formação da identidade na infância. Canções originais evocam ritmos brasileiros e cantigas populares, enquanto máscaras e personagens arquetípicos ajudam a narrar uma história sobre luto, amadurecimento e autonomia emocional. Celebrando a força da imaginação e da brincadeira, Desventuras de Maria busca dar forma ao delicado processo de tornar-se quem se é.",
};

export default function DesventurasPage() {
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [selection, setSelection] = useState({ inteira: 0, meia: 0 });
  const [showPayment, setShowPayment] = useState(false);

  const totalTickets = useMemo(() => selection.inteira + selection.meia, [selection]);

  const amount = useMemo(() => {
    const inteira = parseFloat(EVENT.priceInteira || EVENT.price.replace("R$ ", "").replace(",", "."));
    const meia = EVENT.priceMeia ? parseFloat(EVENT.priceMeia) : inteira * 0.5;
    return inteira * selection.inteira + meia * selection.meia;
  }, [selection]);

  const handleChange = (field: "name" | "email" | "phone", value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const updateQty = (type: "inteira" | "meia", inc: boolean) => {
    setSelection((prev) => {
      const next = { ...prev } as typeof prev;
      next[type] = Math.max(0, next[type] + (inc ? 1 : -1));
      return next;
    });
  };

  const startPayment = () => {
    if (!customer.name || !customer.email) {
      alert("Por favor, preencha nome e e-mail.");
      return;
    }
    if (totalTickets <= 0) {
      alert("Selecione pelo menos um ingresso.");
      return;
    }
    setShowPayment(true);
  };

  const handleSuccess = (paymentId: string) => {
    // Redireciona para a página de sucesso existente
    window.location.href = `/payment-success?payment_id=${paymentId}`;
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <div className="flex justify-center flex-col items-center mb-6">

      <Image src={'/logo-mark-black.png'} alt={EVENT.title} width={200} height={200} />
        <div className="mb-6">
          <p className="text-2xl font-bold text-gray-900 text-center mt-2">APRESENTA</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{EVENT.title}</h1>
          <p className="text-gray-700 mt-1 font-semibold">{EVENT.date} • {EVENT.location}</p>
        </div>
        </div>

        {!showPayment ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
              <img
                src={EVENT.image}
                alt={EVENT.title}
                className="w-full max-w-xs md:max-w-full h-auto md:h-[500px] block mx-auto object-contain"
              />
              <p className="text-gray-700 mt-1 font-bold text-left md:text-justify leading-relaxed break-words">
                {EVENT.release}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Selecionar ingressos</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800">Inteira</p>
                    <p className="text-sm text-gray-600">R$ {parseFloat(EVENT.priceInteira).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty("inteira", false)} className="w-9 h-9 rounded-full bg-white border border-gray-300 hover:bg-gray-100">−</button>
                    <div className="min-w-[40px] text-center font-bold">{selection.inteira}</div>
                    <button onClick={() => updateQty("inteira", true)} className="w-9 h-9 rounded-full bg-yellow-100 border border-yellow-300 hover:bg-yellow-200">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800">Meia / Antecipado</p>
                    <p className="text-sm text-gray-600">R$ {parseFloat(EVENT.priceMeia).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty("meia", false)} className="w-9 h-9 rounded-full bg-white border border-gray-300 hover:bg-gray-100">−</button>
                    <div className="min-w-[40px] text-center font-bold">{selection.meia}</div>
                    <button onClick={() => updateQty("meia", true)} className="w-9 h-9 rounded-full bg-yellow-100 border border-yellow-300 hover:bg-yellow-200">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Dados do comprador</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  placeholder="Nome completo"
                />
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  placeholder="E-mail"
                />
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  placeholder="Telefone (opcional)"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between text-gray-800">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">R$ {amount.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalTickets === 1 ? '1 ingresso' : `${totalTickets} ingressos`}
              </p>
            </div>

            <button
              onClick={() => alert("Vendas encerradas")}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50"              
            >
              Continuar para pagamento
            </button>
          </div>
        ) : (
          <MercadoPagoPayment
            amount={amount}
            customerInfo={customer}
            eventInfo={{
              title: EVENT.title,
              date: EVENT.date,
              location: EVENT.location,
              price: EVENT.price,
              id: EVENT.id,
            }}
            ticketQuantity={totalTickets}
            ticketType={selection.inteira > 0 ? "inteira" : "meia"}
            breakdown={{ inteira: selection.inteira, meia: selection.meia }}
            onSuccess={handleSuccess}
            onError={(msg) => alert(msg)}
            onCancel={() => setShowPayment(false)}
          />
        )}
      </div>

      {/* Nenhum link para outras páginas */}
    </div>
  );
}
