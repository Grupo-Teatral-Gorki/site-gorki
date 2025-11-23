"use client";
import { useState, useMemo } from "react";
import MercadoPagoPayment from "@/components/MercadoPagoPayment";
import Image from "next/image";

const SESSIONS = [
  {
    id: "casa-fechada-001-13-12",
    date: "13-12-2025",
    time: "20:00",
    displayDate: "13 de Dezembro de 2025",
  },
  {
    id: "casa-fechada-001-14-12",
    date: "14-12-2025",
    time: "20:00",
    displayDate: "14 de Dezembro de 2025",
  },
];

const EVENT = {
  title: "A Casa Fechada",
  location: "Arena Porão",
  image: "https://firebasestorage.googleapis.com/v0/b/itapevi-cce4e.firebasestorage.app/o/WhatsApp%20Image%202025-09-30%20at%2017.40.58.jpeg?alt=media&token=67add5bd-893c-49fc-86ef-287e1040f83a",
  // Preços em string no formato já usado no site
  price: "R$ 00,00",
  priceInteira: "40.00",
  priceMeia: "20.00",
  release: `• Peça: A CASA FECHADA 
• Texto de: Roberto Gomes 
• Direção: Bolinha Monteiro 
• Assistente de direção: Angélica Bellini 
• Sonoplastia: Bolinha Monteiro 
• Figurinos: o grupo 

Sinopse:

São 18:00 de um dia qualquer, e um correio de uma cidadezinha qualquer. Desculpas são inventadas para passar o tempo de uma vida estagnada e inútil. Seres na penumbra revelam suas verdadeiras faces que vigiam e invejam a coragem alheia. E a vítima? Ela...!

Elenco:
Laura Liz
Matheus Fideles
Marlon Ferreira
Ricardo Babrikowski
Wendel Reis
Denise Ferrassini
Luciana Vianna
Heverton Araújo
Angélica Bellini`,
};

export default function DesventurasPage() {
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [selection, setSelection] = useState({ inteira: 0, meia: 0 });
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [errors, setErrors] = useState({ session: false, name: false, email: false, tickets: false });

  const totalTickets = useMemo(() => selection.inteira + selection.meia, [selection]);

  const amount = useMemo(() => {
    const inteira = parseFloat(EVENT.priceInteira || EVENT.price.replace("R$ ", "").replace(",", "."));
    const meia = EVENT.priceMeia ? parseFloat(EVENT.priceMeia) : inteira * 0.5;
    return inteira * selection.inteira + meia * selection.meia;
  }, [selection]);

  const handleChange = (field: "name" | "email" | "phone", value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === "name" || field === "email") {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const updateQty = (type: "inteira" | "meia", inc: boolean) => {
    setSelection((prev) => {
      const next = { ...prev } as typeof prev;
      next[type] = Math.max(0, next[type] + (inc ? 1 : -1));
      return next;
    });
    // Clear tickets error when user selects tickets
    setErrors((prev) => ({ ...prev, tickets: false }));
  };

  const startPayment = () => {
    // Reset errors
    const newErrors = {
      session: !selectedSession,
      name: !customer.name.trim(),
      email: !customer.email.trim(),
      tickets: totalTickets <= 0
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
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
          <div className="mb-6 text-center">
            <p className="text-2xl font-bold text-gray-900 text-center mt-2">APRESENTA</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{EVENT.title}</h1>
            <p className="text-gray-700 mt-1 font-semibold">{EVENT.location}</p>
          </div>
        </div>

        {!showPayment ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6 items-center">
              <p className="text-gray-700 mt-1 font-bold text-left md:text-justify leading-relaxed break-words whitespace-pre-line">
                {EVENT.release}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Selecionar sessão</h2>
              {errors.session && (
                <p className="text-red-600 text-sm mb-2">Por favor, selecione uma sessão</p>
              )}
              <div className="space-y-3 mb-6">
                {SESSIONS.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session.id);
                      setErrors((prev) => ({ ...prev, session: false }));
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedSession === session.id
                      ? "border-yellow-500 bg-yellow-50"
                      : errors.session
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50 hover:border-yellow-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{session.displayDate}</p>
                        <p className="text-sm text-gray-600">Horário: {session.time}</p>
                      </div>
                      {selectedSession === session.id && (
                        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Selecionar ingressos</h2>
              {errors.tickets && (
                <p className="text-red-600 text-sm mb-2">Selecione pelo menos um ingresso</p>
              )}
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
                <div>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                    placeholder="Nome completo"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">Nome é obrigatório</p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                    placeholder="E-mail"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">E-mail é obrigatório</p>
                  )}
                </div>
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
              onClick={startPayment}
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
              date: (() => {
                const session = SESSIONS.find(s => s.id === selectedSession);
                return session ? `${session.displayDate} às ${session.time}` : "";
              })(),
              location: EVENT.location,
              price: EVENT.price,
              id: selectedSession || "",
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
