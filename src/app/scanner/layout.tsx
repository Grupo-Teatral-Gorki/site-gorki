export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scanner de Ingressos</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
