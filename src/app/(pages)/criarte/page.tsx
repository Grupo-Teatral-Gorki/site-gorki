"use client";
import { motion } from "framer-motion";

const GestaoDeCultura = () => (
  <motion.div
    className="w-full flex flex-col items-center pt-10 px-2 mb-20 bg-white"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <h1 className="text-4xl font-bold mb-4 text-black">Gestão de Cultura</h1>
    <p className="text-lg text-gray-700 max-w-2xl text-justify">
      O Criarte é uma solução completa e personalizável para a gestão de
      projetos culturais, integrando todas as etapas do processo — da submissão
      de propostas à prestação de contas. A plataforma conta com módulos
      avançados para cadastro de artistas, acompanhamento físico-financeiro,
      gestão de editais, painéis em tempo real com indicadores e um portal
      público de consulta. O Criarte também inclui a implantação em ambiente
      indicado pelo cliente, migração segura de dados legados, configuração de
      workflows e perfis de usuário, além de treinamento completo da equipe com
      suporte técnico especializado. Com o Criarte, a gestão cultural torna-se
      mais eficiente, transparente e segura. Oferecemos suporte com SLA de até
      24 horas para incidentes críticos, atualizações constantes da plataforma,
      manutenção corretiva sem custos adicionais e conformidade total com a
      LGPD. Recursos como visualização georreferenciada, autenticação segura,
      trilha de auditoria e relatórios customizáveis garantem controle total e
      transparência na execução de políticas públicas voltadas à cultura.
    </p>
    <a
      href="https://criarte.grupogorki.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-12 inline-block px-8 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow hover:bg-yellow-600 transition-colors"
    >
      Acessar Criarte
    </a>
  </motion.div>
);

export default GestaoDeCultura;
