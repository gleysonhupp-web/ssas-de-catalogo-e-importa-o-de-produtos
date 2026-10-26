import { CsvImport } from "./CsvImport";

export default function ImportPage() {
  return (
    <div className="stack">
      <h1>Lote de cadastro (CSV)</h1>
      <p className="muted small">
        Uma linha por variante. Colunas: <code>codigo, nome, descricao, marca, categoria, sku, opcoes, gtin, imagens, licenca,
        origem, preco_sugerido</code>. Opções no formato <code>Cor:05|Volume:4ml</code>; várias imagens separadas por{" "}
        <code>|</code>. Aceita vírgula ou ponto e vírgula como separador. Produtos com código já existente são ignorados.
      </p>
      <p><a className="btn" href="/modelo-catalogo.csv" download>Baixar modelo</a></p>
      <CsvImport />
    </div>
  );
}
