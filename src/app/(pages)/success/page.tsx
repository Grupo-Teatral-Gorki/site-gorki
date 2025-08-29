export default function Success() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        Pagamento aprovado!
      </h1>
      <p className="text-lg text-green-800">
        Sua transação foi concluída com sucesso.
      </p>
    </div>
  );
}
