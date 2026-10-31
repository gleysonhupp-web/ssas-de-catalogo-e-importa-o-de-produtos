import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { formatBRL, quote } from "@/lib/pricing";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingMotion } from "@/components/LandingMotion";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

// Landing page pública. Estrutura inspirada em páginas de planos (faixa de avisos, hero com oferta,
// cartões de preço, passos, recursos, perguntas e chamada final), com o conteúdo do LoteOn.
// Tudo o que a página afirma corresponde ao que o produto faz hoje: nada de depoimentos ou números inventados.

const PACKS = [
  { quantity: 50, name: "Começo", blurb: "Para testar o catálogo e abrir a loja com variedade." },
  { quantity: 200, name: "Vitrine", blurb: "Para lojas que querem ampliar o mix de uma vez." },
  { quantity: 500, name: "Loja completa", blurb: "Para montar ou renovar um catálogo inteiro." },
];

const PACK_FEATURES = [
  "Ficha completa: fotos, descrição e variações",
  "Variações (tamanho, cor) sem custo extra",
  "Seu preço de venda definido antes de importar",
  "Produtos criados ocultos para você revisar",
  "Reprocessamento grátis se um item falhar",
];

const STEPS = [
  { title: "Escolha os produtos", text: "Navegue pelo catálogo, filtre por categoria e marca, e adicione ao carrinho o que quer vender." },
  { title: "Defina seu preço", text: "No carrinho você vê o preço no fornecedor e escreve o seu preço de revenda, produto por produto." },
  { title: "Importe para a Nuvemshop", text: "Pague com Pix ou cartão e os produtos vão para a sua loja com descrição, fotos e variações." },
];

const FEATURES = [
  { title: "Sem mensalidade", text: "Você paga só pelos produtos que importar. Não importou, não pagou." },
  { title: "Preço de revenda do seu jeito", text: "Defina o valor de cada produto ou use uma regra para o lote inteiro, como preço sugerido mais uma porcentagem." },
  { title: "Revise antes de publicar", text: "Por padrão os produtos entram ocultos na loja. Você confere e publica quando quiser." },
  { title: "Falhou? Reprocessa grátis", text: "Se a Nuvemshop recusar algum item, você corrige e manda de novo sem pagar outra vez." },
  { title: "Catálogo curado", text: "As fichas são preparadas e revisadas pela equipe do LoteOn antes de entrar no catálogo." },
  { title: "Sem anúncio duplicado", text: "Antes de criar, o LoteOn confere se o produto já está na loja. Repetir a importação não duplica." },
];

const AUDIENCE = [
  { title: "Quem está abrindo a loja", text: "Comece com dezenas de produtos cadastrados em vez de passar semanas escrevendo fichas." },
  { title: "Quem quer ampliar o mix", text: "Teste novas categorias sem gastar tempo cadastrando item por item." },
  { title: "Quem revende marcas", text: "Use fichas padronizadas e foque no que importa: preço, estoque e venda." },
];

// Peças da ficha de produto que atravessam o topo da página, vindo do fundo e saindo pela frente da tela.
const FLYING = [
  { label: "Fotos", dx: -60, dy: -38, delay: 0, dur: 7 },
  { label: "P · M · G", dx: 30, dy: -45, delay: 1, dur: 7.5 },
  { label: "Descrição", dx: 38, dy: 40, delay: 2, dur: 6.5 },
  { label: "R$ 399,90", dx: -48, dy: 36, delay: 3, dur: 7 },
  { label: "Variações", dx: -20, dy: -55, delay: 4, dur: 8 },
  { label: "Nuvemshop", dx: 45, dy: -5, delay: 5, dur: 6.5 },
  { label: "Preto · Branco", dx: -70, dy: 0, delay: 1.6, dur: 8 },
  { label: "Pronto", dx: 5, dy: 52, delay: 3.6, dur: 6 },
  { label: "Fotos HD", dx: 55, dy: 30, delay: 5.6, dur: 7.5 },
  { label: "Tamanhos", dx: -35, dy: -20, delay: 6.4, dur: 7 },
];

const HEADLINE = "Sua loja cheia de produtos em minutos, não em semanas";

// Atraso de entrada em cascata para itens de uma grade.
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default async function Home() {
  const user = await currentUser();
  const unit = quote(1).unitPriceCents;
  const price = formatBRL(unit);
  const start = user ? { href: "/catalogo", label: "Ir para o catálogo" } : { href: "/cadastro", label: "Criar conta grátis" };

  const faq = [
    { q: "Preciso pagar mensalidade?", a: `Não. O LoteOn cobra ${price} por produto importado, uma vez só. Sem plano, sem fidelidade.` },
    { q: "As variações contam como produtos diferentes?", a: "Não. Um produto com vários tamanhos ou cores conta como um só." },
    { q: "Eu escolho o preço de venda?", a: "Sim. No carrinho você define o preço de revenda de cada produto antes de importar. Os produtos sem preço definido seguem a regra que você escolher no pagamento." },
    { q: "Os produtos aparecem na loja na hora?", a: "Por padrão eles são criados ocultos, para você revisar. Se preferir, pode marcar para publicar visíveis já na importação." },
    { q: "O LoteOn vende ou envia a mercadoria?", a: "Não. O LoteOn entrega a ficha do produto pronta na sua loja. A compra da mercadoria e o estoque continuam com você." },
    { q: "E se algum produto falhar na importação?", a: "Você vê o motivo do erro, corrige e reprocessa sem nova cobrança." },
    { q: "Funciona com quais plataformas?", a: "Hoje com a Nuvemshop." },
    { q: "Como eu pago?", a: "Por Pix ou cartão, pelo Mercado Pago. A importação começa quando o pagamento é confirmado." },
  ];

  return (
    <div className="lp">
      <LandingMotion />
      <div className="lp-ticker" aria-hidden="true">
        <div className="lp-ticker-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {price} por produto · Sem mensalidade · Variações inclusas · Reprocessamento grátis · Pix ou cartão ·{" "}
            </span>
          ))}
        </div>
      </div>

      <header className="lp-header">
        <div className="lp-wrap lp-header-row">
          <Link href="/" aria-label="LoteOn, página inicial"><Logo /></Link>
          <nav className="lp-nav" aria-label="Seções">
            <a href="#como-funciona">Como funciona</a>
            <a href="#precos">Preços</a>
            <a href="#perguntas">Perguntas</a>
          </nav>
          <div className="lp-header-actions">
            <ThemeToggle />
            {!user && <Link href="/entrar" className="btn">Entrar</Link>}
            <Link href={start.href} className="btn btn-primary">{user ? "Abrir o app" : "Criar conta"}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-scene" aria-hidden="true">
            <div className="lp-orb lp-orb-a" />
            <div className="lp-orb lp-orb-b" />
            <div className="lp-floor" />
          </div>
          <div className="lp-scene lp-scene-front" aria-hidden="true">
            <div className="lp-flyers">
              {FLYING.map((f) => (
                <span
                  key={f.label}
                  className="lp-flyer"
                  style={{ "--dx": `${f.dx}vw`, "--dy": `${f.dy}vh`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` } as CSSProperties}
                >
                  <i />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
          <div className="lp-wrap lp-hero-grid">
            <div className="stack lp-hero-copy">
              <span className="lp-kicker">Catálogo pronto para a sua Nuvemshop</span>
              <h1 className="lp-h1" aria-label={HEADLINE}>
                {HEADLINE.split(" ").map((w, i) => (
                  <span key={i} className="lp-word" style={stagger(i)} aria-hidden="true">{w} </span>
                ))}
              </h1>
              <p className="lp-lead">
                Escolha no catálogo, defina seu preço de venda e importe com descrição, fotos e variações. Pague só pelo que importar.
              </p>
              <p className="lp-price-hook">
                A partir de <strong>{price}</strong> por produto
              </p>
              <div className="row">
                <Link href={start.href} className="btn btn-primary lp-btn-lg">{start.label}</Link>
                {user ? (
                  <Link href="/lojas" className="btn lp-btn-lg">Minha loja</Link>
                ) : (
                  <Link href="/catalogo" className="btn lp-btn-lg">Ver o catálogo</Link>
                )}
              </div>
              <ul className="lp-trust">
                <li>Sem mensalidade</li>
                <li>Pix ou cartão</li>
                <li>Revisão antes de publicar</li>
              </ul>
            </div>

            <div className="lp-stage">
            <div className="lp-mock" aria-label="Exemplo: produto de R$ 99,90 no fornecedor importado por R$ 399,90">
              <div className="lp-mock-card">
                <span className="lp-mock-label">No fornecedor</span>
                <strong>Calçado masculino</strong>
                <span className="lp-mock-price muted">R$ 99,90</span>
              </div>
              <div className="lp-mock-arrow" aria-hidden="true">↓</div>
              <div className="lp-mock-card lp-mock-accent">
                <span className="lp-mock-label">Seu preço de venda</span>
                <span className="lp-mock-input">R$ 399,90</span>
                <span className="small muted">300% acima do fornecedor</span>
              </div>
              <div className="lp-mock-arrow" aria-hidden="true">↓</div>
              <div className="lp-mock-card">
                <span className="lp-mock-label">Na sua loja</span>
                <strong>Importado com descrição, fotos e tamanhos</strong>
                <span className="badge badge-ok">Pronto para revisar</span>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section id="precos" className="lp-section">
          <div className="lp-wrap stack">
            <div className="lp-section-head" data-reveal>
              <h2>Pague por produto, sem plano</h2>
              <p className="muted">O preço é o mesmo em qualquer quantidade. Veja alguns exemplos de lote.</p>
            </div>
            <div className="lp-pricing">
              {PACKS.map((p, i) => {
                const q = quote(p.quantity);
                return (
                  <article key={p.quantity} className="lp-plan" data-reveal data-tilt style={stagger(i)}>
                    <h3>{p.name}</h3>
                    <p className="small muted">{p.blurb}</p>
                    <p className="lp-plan-qty">{p.quantity} produtos</p>
                    <p className="lp-plan-total">{formatBRL(q.totalCents)}</p>
                    <p className="small muted">{price} por produto · pagamento único</p>
                    <Link href={start.href} className="btn btn-primary">Escolher produtos</Link>
                    <ul className="lp-checks">
                      {PACK_FEATURES.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </article>
                );
              })}
            </div>
            <p className="small muted lp-center">
              Precisa de outra quantidade? Escolha quantos produtos quiser: o total é sempre {price} vezes o número de produtos.
            </p>
          </div>
        </section>

        <section id="como-funciona" className="lp-section lp-alt">
          <div className="lp-wrap stack">
            <div className="lp-section-head" data-reveal>
              <h2>Como funciona</h2>
              <p className="muted">Três passos entre o catálogo e a sua loja.</p>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="lp-step" data-reveal style={stagger(i)}>
                  <span className="lp-step-n">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p className="muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap stack">
            <div className="lp-section-head" data-reveal>
              <h2>Feito para quem vende, não para quem cadastra</h2>
              <p className="muted">O trabalho chato fica com o LoteOn. O preço e a venda ficam com você.</p>
            </div>
            <div className="lp-features">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="lp-feature" data-reveal data-tilt style={stagger(i)}>
                  <h3>{f.title}</h3>
                  <p className="muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-alt">
          <div className="lp-wrap stack">
            <div className="lp-section-head" data-reveal>
              <h2>Para quem é o LoteOn</h2>
            </div>
            <div className="lp-features lp-three">
              {AUDIENCE.map((a, i) => (
                <div key={a.title} className="lp-feature" data-reveal data-tilt style={stagger(i)}>
                  <h3>{a.title}</h3>
                  <p className="muted">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="perguntas" className="lp-section">
          <div className="lp-wrap stack" style={{ maxWidth: 760 }}>
            <div className="lp-section-head" data-reveal>
              <h2>Perguntas frequentes</h2>
            </div>
            <div className="lp-faq" data-reveal>
              {faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-wrap stack lp-center" data-reveal>
            <h2>Sua loja com produtos. Agora.</h2>
            <p>Crie a conta, escolha os produtos e defina seus preços. Você só paga quando for importar.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link href={start.href} className="btn lp-btn-lg lp-btn-inverse">{start.label}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div className="stack" style={{ gap: 8 }}>
            <Logo />
            <p className="small muted">Catálogo e importação de produtos para lojas Nuvemshop.</p>
          </div>
          <nav className="stack small" style={{ gap: 6 }} aria-label="Produto">
            <strong>Produto</strong>
            <Link href="/catalogo">Catálogo</Link>
            <a href="#precos">Preços</a>
            <a href="#como-funciona">Como funciona</a>
          </nav>
          <nav className="stack small" style={{ gap: 6 }} aria-label="Conta">
            <strong>Conta</strong>
            <Link href="/entrar">Entrar</Link>
            <Link href="/cadastro">Criar conta</Link>
            <a href="#perguntas">Perguntas frequentes</a>
          </nav>
        </div>
        <div className="lp-wrap small muted lp-footer-legal">© {new Date().getFullYear()} LoteOn. Pagamentos processados pelo Mercado Pago.</div>
      </footer>
    </div>
  );
}
