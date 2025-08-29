export default function Pending() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
      <h1 className="text-3xl font-bold text-yellow-700 mb-4">
        Pagamento pendente
      </h1>
      <p className="text-lg text-yellow-800">
        Sua transação está em análise ou aguardando confirmação.
      </p>
    </div>
  );
}
