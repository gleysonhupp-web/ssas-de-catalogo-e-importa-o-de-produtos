// Esqueleto mostrado na hora em que o lojista clica, enquanto a página busca os dados.
export function PageLoading() {
  return (
    <main className="container stack" aria-busy="true" aria-label="Carregando">
      <div className="skel skel-title" />
      <div className="skel skel-bar" />
      <div className="grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card stack" style={{ gap: 8 }}>
            <div className="skel skel-img" />
            <div className="skel skel-line" />
            <div className="skel skel-line short" />
          </div>
        ))}
      </div>
    </main>
  );
}
