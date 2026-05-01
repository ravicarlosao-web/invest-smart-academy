import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function Privacidade() {
  useSEO({
    title: "Política de Privacidade — TradeAcademy Angola",
    description: "Política de privacidade e protecção de dados da plataforma TradeAcademy Angola — como recolhemos, usamos e protegemos os seus dados.",
    canonical: "/privacidade",
  });

  return (
    <div className="min-h-screen bg-[#060709] text-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#060709]/90 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">TradeAcademy</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <h1 className="text-4xl font-extrabold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualização: Maio de 2025</p>

        <div className="space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introdução</h2>
            <p>
              A TradeAcademy respeita a tua privacidade e está comprometida com a protecção dos teus dados
              pessoais. Esta Política de Privacidade descreve como recolhemos, utilizamos e protegemos as
              informações que nos forneces ao utilizar a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Dados que Recolhemos</h2>
            <p className="mb-3">Ao utilizar a Plataforma, podemos recolher os seguintes dados:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Dados de registo:</strong> nome, endereço de e-mail e palavra-passe (armazenada de forma encriptada).</li>
              <li><strong className="text-white">Dados de progresso:</strong> lições concluídas, XP acumulado, conquistas, missões e resultados de quizzes.</li>
              <li><strong className="text-white">Dados do simulador:</strong> trades simulados, incluindo activos, preços de entrada/saída e resultados virtuais.</li>
              <li><strong className="text-white">Dados de subscrição:</strong> comprovativo de pagamento submetido para validação do Plano Premium.</li>
              <li><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador e sistema operativo, para fins de segurança e diagnóstico.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Como Usamos os Teus Dados</h2>
            <p className="mb-3">Utilizamos os teus dados para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Gerir a tua conta e autenticar o acesso à Plataforma.</li>
              <li>Acompanhar o teu progresso e personalizar a experiência de aprendizagem.</li>
              <li>Processar e validar subscrições do Plano Premium.</li>
              <li>Enviar notificações relacionadas com a tua actividade na Plataforma.</li>
              <li>Melhorar a Plataforma com base em dados de utilização agregados e anónimos.</li>
              <li>Garantir a segurança e prevenir abusos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Partilha de Dados</h2>
            <p>
              Não vendemos, alugamos nem partilhamos os teus dados pessoais com terceiros para fins comerciais.
              Os teus dados apenas podem ser partilhados nas seguintes circunstâncias:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Com fornecedores de serviços técnicos (base de dados, alojamento) vinculados por acordos de confidencialidade.</li>
              <li>Quando exigido por lei ou por autoridade competente.</li>
              <li>Para proteger os direitos, segurança ou propriedade da TradeAcademy ou dos utilizadores.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Retenção de Dados</h2>
            <p>
              Mantemos os teus dados enquanto a tua conta estiver activa. Após eliminação da conta, os dados
              pessoais identificáveis são removidos no prazo de 30 dias, podendo alguns dados anónimos e
              agregados ser retidos para fins estatísticos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Segurança</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger os teus dados contra acesso não
              autorizado, perda ou divulgação. As palavras-passe são armazenadas com hashing seguro. A
              comunicação entre o teu browser e a Plataforma é encriptada via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Cookies e Armazenamento Local</h2>
            <p>
              A Plataforma utiliza armazenamento local do browser (localStorage) para manter a sessão autenticada
              e guardar preferências como progresso offline e configurações do simulador. Não utilizamos cookies
              de rastreamento de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Os Teus Direitos</h2>
            <p className="mb-3">Tens o direito de:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Aceder aos dados pessoais que guardamos sobre ti.</li>
              <li>Solicitar a correcção de dados incorrectos.</li>
              <li>Solicitar a eliminação da tua conta e dados associados.</li>
              <li>Opor-te ao tratamento dos teus dados para determinadas finalidades.</li>
            </ul>
            <p className="mt-3">Para exerceres estes direitos, contacta-nos através da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Menores de Idade</h2>
            <p>
              A Plataforma não se destina a menores de 18 anos. Se tiveres conhecimento de que um menor
              forneceu dados pessoais sem o consentimento dos responsáveis, contacta-nos para que possamos
              tomar as medidas adequadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Alterações a esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidade periodicamente. Alterações significativas serão
              notificadas na Plataforma. O uso continuado após qualquer alteração constitui aceitação da
              política revista.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contacto</h2>
            <p>
              Para questões sobre privacidade ou para exerceres os teus direitos, contacta-nos através
              da Plataforma ou pelo e-mail indicado na secção de suporte.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
          <Link to="/" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">← Voltar ao início</Link>
          <Link to="/termos" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Termos de Serviço →</Link>
        </div>
      </main>
    </div>
  );
}
