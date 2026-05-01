import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function Termos() {
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
        <h1 className="text-4xl font-extrabold mb-2">Termos de Serviço</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualização: Maio de 2025</p>

        <div className="space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao aceder ou utilizar a plataforma TradeAcademy ("Plataforma"), concordas com estes Termos de Serviço
              e com a nossa Política de Privacidade. Se não concordares com algum destes termos, não deves utilizar
              a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              A TradeAcademy é uma plataforma de educação em trading e investimentos. O serviço inclui aulas
              estruturadas, vídeo aulas curadas, um simulador de trading virtual, duelos entre utilizadores,
              biblioteca de livros, glossário e recursos complementares. Todo o conteúdo tem fins exclusivamente
              educativos e não constitui aconselhamento financeiro ou de investimento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Planos e Pagamentos</h2>
            <p className="mb-3">
              A Plataforma oferece dois planos de acesso:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Plano Iniciante (Gratuito):</strong> acesso permanente ao nível 1, simulador e recursos básicos.</li>
              <li><strong className="text-white">Plano Premium:</strong> acesso completo a todos os níveis, vídeo aulas, biblioteca, duelos e suporte prioritário, mediante subscrição mensal.</li>
            </ul>
            <p className="mt-3">
              O pagamento do Plano Premium é efectuado via transferência bancária. O acesso premium é activado
              manualmente após confirmação do pagamento pelo administrador. Não são processados reembolsos após
              activação do acesso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Conta de Utilizador</h2>
            <p>
              Ao registares-te, és responsável por manter a confidencialidade das tuas credenciais de acesso.
              Não podes partilhar a tua conta com terceiros. A TradeAcademy reserva-se o direito de suspender
              ou eliminar contas que violem estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Utilização Aceitável</h2>
            <p className="mb-3">É proibido:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Tentar aceder a funcionalidades ou dados de outros utilizadores sem autorização.</li>
              <li>Reproduzir, distribuir ou revender o conteúdo da Plataforma sem autorização prévia.</li>
              <li>Utilizar a Plataforma para fins ilegais ou que violem direitos de terceiros.</li>
              <li>Tentar comprometer a segurança ou integridade da Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Aviso de Risco</h2>
            <p>
              O trading e o investimento em mercados financeiros envolvem riscos significativos de perda de capital.
              O conteúdo da TradeAcademy tem finalidade exclusivamente educativa. A TradeAcademy não garante
              resultados financeiros e não é responsável por decisões de investimento tomadas pelos utilizadores.
              O simulador usa dados fictícios e não reflecte necessariamente condições reais de mercado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma — incluindo texto, gráficos, logótipos, ícones e software — é propriedade
              da TradeAcademy ou dos seus licenciadores e está protegido pela legislação aplicável. É concedida ao
              utilizador uma licença limitada, pessoal e intransmissível para acesso ao conteúdo para uso pessoal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Limitação de Responsabilidade</h2>
            <p>
              Na máxima extensão permitida por lei, a TradeAcademy não é responsável por quaisquer danos directos,
              indirectos, incidentais ou consequentes resultantes do uso ou impossibilidade de uso da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Alterações aos Termos</h2>
            <p>
              A TradeAcademy pode actualizar estes Termos a qualquer momento. Alterações significativas serão
              comunicadas através da Plataforma. O uso continuado após qualquer alteração constitui aceitação
              dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pela legislação angolana. Qualquer litígio decorrente da utilização
              da Plataforma será submetido à jurisdição dos tribunais competentes da República de Angola.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contacto</h2>
            <p>
              Para questões relativas a estes Termos, contacta-nos através da Plataforma ou pelo e-mail
              indicado na secção de suporte.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
          <Link to="/" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">← Voltar ao início</Link>
          <Link to="/privacidade" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Política de Privacidade →</Link>
        </div>
      </main>
    </div>
  );
}
