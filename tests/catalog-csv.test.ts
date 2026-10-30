import { describe, expect, it } from "vitest";
import { parseCatalogCsv, parseCsv } from "@/lib/catalog-csv";

const HEADER = "codigo,nome,descricao,marca,categoria,sku,opcoes,gtin,imagens,licenca,origem,preco_sugerido";
const cats = new Set(["batom", "base"]);

describe("parseCsv", () => {
  it("entende aspas, vírgulas dentro do campo e CRLF", () => {
    expect(parseCsv('a,"b, c","d ""x"""\r\n1,2,3\r\n')).toEqual([
      ["a", "b, c", 'd "x"'],
      ["1", "2", "3"],
    ]);
  });
});

describe("parseCatalogCsv", () => {
  it("agrupa variantes pelo código do produto", () => {
    const csv = [
      HEADER,
      "CAT-BEA-000142,Batom matte,Acabamento matte,Marca X,batom,B142-1,Cor:01 Nude,,https://img/a.jpg|https://img/b.jpg,própria,estúdio,39.90",
      "CAT-BEA-000142,Batom matte,Acabamento matte,Marca X,batom,B142-2,Cor:02 Rosé,,https://img/a.jpg,própria,estúdio,39.90",
    ].join("\n");
    const { products, issues } = parseCatalogCsv(csv, cats);
    expect(issues).toEqual([]);
    expect(products).toHaveLength(1);
    expect(products[0].variants.map((v) => v.options.Cor)).toEqual(["01 Nude", "02 Rosé"]);
    expect(products[0].images).toHaveLength(2);
    expect(products[0].suggestedPrice).toBe(39.9);
  });

  it("lê o preço no fornecedor quando a coluna existe", () => {
    const csv = [
      `${HEADER},preco_fornecedor`,
      "CAT-BEA-000143,Batom,Acabamento matte,Marca X,batom,B143-1,Cor:01 Nude,,https://img/a.jpg,própria,estúdio,399.90,\"99,90\"",
      "CAT-BEA-000144,Base,Acabamento matte,Marca X,base,B144-1,,,https://img/a.jpg,própria,estúdio,,-1",
    ].join("\n");
    const { products, issues } = parseCatalogCsv(csv, cats);
    expect(products[0].supplierPrice).toBe(99.9);
    expect(issues).toEqual([{ line: 3, message: "preço no fornecedor inválido: -1" }]);
  });

  it("aponta a linha e o motivo de cada erro", () => {
    const csv = [
      HEADER,
      "XYZ,Batom,Desc,,batom,S1,,,https://img/a.jpg,própria,estúdio,",
      "CAT-BEA-000001,Base,Desc,,inexistente,S2,,,ftp://img,própria,estúdio,",
      "CAT-BEA-000002,Base,Desc,,base,S3,Cor,,https://img/a.jpg,,estúdio,",
    ].join("\n");
    const { products, issues } = parseCatalogCsv(csv, cats);
    expect(products).toEqual([]);
    expect(issues.map((i) => i.line)).toEqual([2, 3, 3, 4, 4]);
    expect(issues.some((i) => i.message.includes("licenca"))).toBe(true);
  });

  it("recusa SKU repetido", () => {
    const csv = [
      HEADER,
      "CAT-BEA-000001,A,D,,batom,DUP,,,https://img/a.jpg,l,o,",
      "CAT-BEA-000002,B,D,,batom,DUP,,,https://img/a.jpg,l,o,",
    ].join("\n");
    expect(parseCatalogCsv(csv, cats).issues[0]).toMatchObject({ line: 3 });
  });

  it("recusa arquivo sem colunas obrigatórias", () => {
    expect(parseCatalogCsv("codigo,nome\nx,y", cats).issues[0].message).toContain("Colunas obrigatórias");
  });
});

describe("separador ponto e vírgula", () => {
  it("lê CSV salvo pelo Excel em português", () => {
    expect(parseCsv("a;b;c\n1;2,5;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2,5", "3"],
    ]);
  });
});
