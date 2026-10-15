import React, { useEffect, useState } from "react";

const batchSize = 8;

export function PdfPageThumbnails({
  pdf,
  number,
  onSelect,
  busy,
  freeElements = [],
}) {
  const [batch, setBatch] = useState(Math.floor((number - 1) / batchSize));
  const [images, setImages] = useState({});
  const [error, setError] = useState("");
  const first = batch * batchSize + 1;
  const last = Math.min(first + batchSize - 1, pdf.numPages);

  useEffect(() => {
    setBatch(Math.floor((number - 1) / batchSize));
  }, [number]);

  useEffect(() => {
    let active = true;
    let rendering;
    setImages({});
    setError("");
    (async () => {
      // Render only eight small pages, sequentially. Full-resolution previews
      // stay on the main canvas rather than competing for mobile memory.
      for (let pageNumber = first; pageNumber <= last; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        if (!active) return;
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(96 / size.width, 144 / size.height),
        });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        rendering = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
          background: "#ffffff",
        });
        await rendering.promise;
        if (!active) return;
        const image = canvas.toDataURL("image/jpeg", 0.8);
        setImages((current) => ({
          ...current,
          [pageNumber]: {
            image,
            width: viewport.width,
            height: viewport.height,
            pageWidth: size.width,
          },
        }));
      }
    })().catch((e) => {
      if (active && e.name !== "RenderingCancelledException")
        setError(
          "Uma miniatura não carregou. Use os botões de página para conferir o PDF.",
        );
    });
    return () => {
      active = false;
      rendering?.cancel();
    };
  }, [pdf, first, last]);

  return (
    <nav className="pdf-thumbnails" aria-label="Miniaturas das páginas">
      <div className="pdf-thumbnail-controls">
        <span>
          Páginas {first}–{last} de {pdf.numPages}
        </span>
        {pdf.numPages > batchSize && (
          <div>
            <button
              type="button"
              className="secondary"
              disabled={batch === 0}
              onClick={() => setBatch((current) => current - 1)}
            >
              Miniaturas anteriores
            </button>
            <button
              type="button"
              className="secondary"
              disabled={last === pdf.numPages}
              onClick={() => setBatch((current) => current + 1)}
            >
              Mais miniaturas
            </button>
          </div>
        )}
      </div>
      <div className="pdf-thumbnail-grid">
        {Array.from(
          { length: last - first + 1 },
          (_, index) => first + index,
        ).map((page) => (
          <button
            key={page}
            type="button"
            className="pdf-thumbnail"
            aria-label={`Ir para a página ${page}`}
            aria-current={page === number ? "page" : undefined}
            disabled={busy}
            onClick={() => onSelect(page)}
          >
            {images[page] ? (
              <span className="pdf-thumbnail-frame">
                <span
                  className="pdf-thumbnail-sheet"
                  style={{
                    width: images[page].width,
                    height: images[page].height,
                  }}
                >
                  <img src={images[page].image} alt="" />
                  {freeElements
                    .filter((element) => element.page === page)
                    .map((element) => (
                      <span
                        key={element.id}
                        className="pdf-thumbnail-overlay"
                        style={{
                          left: `${element.x * 100}%`,
                          top: `${element.y * 100}%`,
                          width:
                            element.kind === "image"
                              ? `${element.width * 100}%`
                              : undefined,
                          color: element.color,
                          fontSize: `${((element.size || 14) / images[page].pageWidth) * 100}cqw`,
                        }}
                      >
                        {element.kind === "image" ? (
                          <img src={element.data} alt="" />
                        ) : (
                          element.text
                        )}
                      </span>
                    ))}
                </span>
              </span>
            ) : (
              <span className="pdf-thumbnail-placeholder">Carregando…</span>
            )}
            <span>{page === 1 ? "1 · Início" : `Página ${page}`}</span>
          </button>
        ))}
      </div>
      {error && <p role="status">{error}</p>}
    </nav>
  );
}
