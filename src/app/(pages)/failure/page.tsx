export default function Failure() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <h1 className="text-3xl font-bold text-red-700 mb-4">
        Pagamento não aprovado
      </h1>
      <p className="text-lg text-red-800">
        Houve um problema ao processar sua transação. Tente novamente.
      </p>
    </div>
  );
}
