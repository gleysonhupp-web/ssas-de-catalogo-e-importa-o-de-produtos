import { ProductForm } from "../ProductForm";
import { saveProductAction } from "../actions";
import { categoryOptions } from "../categories";

export default async function NewProduct() {
  return (
    <div className="stack">
      <h1>Novo produto</h1>
      <p className="muted small">Produtos novos começam como rascunho e só aparecem para os lojistas depois de aprovados.</p>
      <ProductForm action={saveProductAction.bind(null, null)} categories={await categoryOptions()} />
    </div>
  );
}
