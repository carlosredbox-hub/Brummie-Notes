import { FreeLayout } from "./free-layout.jsx";
import { makePdf } from "./offline-pdf.js";
import React, { useEffect, useRef, useState } from "react";
import { openLocalPdf } from "./pdf-import.js";
import { documentPdf, draftDocumentPdf } from "./offline-store.js";

export function PdfPreview({ document, freeEditor }) {
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const canvas = useRef(null),
    [loaded, setLoaded] = useState(null),
    [number, setNumber] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true,
      task;
    setLoaded(null);
    setNumber(1);
    setError("");
    setBusy(true);
    (async () => {
      const blob = document.draftPreview
        ? await draftDocumentPdf(document)
        : document.examplePreview
          ? await makePdf({
              ...document,
              theme: document.theme || document.globalTheme || "basic",
            })
          : await documentPdf(document.id);
      const opened = await openLocalPdf(blob);
      task = opened.task;
      if (active) setLoaded(opened.doc);
      else await task.destroy();
    })().catch((e) => {
      if (active) {
        setError(e.message);
        setBusy(false);
      }
    });
    return () => {
      active = false;
      task?.destroy();
    };
  }, [
    document.id,
    document.status,
    document.theme,
    document.globalTheme,
    document.previewRevision,
  ]);
  useEffect(() => {
    if (!loaded) return;
    let active = true,
      renderTask;
    setBusy(true);
    (async () => {
      const page = await loaded.getPage(number);
      if (!active) return;
      const size = page.getViewport({ scale: 1 });
      setPageSize({ width: size.width, height: size.height });
      const viewport = page.getViewport({ scale: 1.55 }),
        target = canvas.current;
      target.width = Math.ceil(viewport.width);
      target.height = Math.ceil(viewport.height);
      renderTask = page.render({
        canvasContext: target.getContext("2d"),
        viewport,
      });
      await renderTask.promise;
      if (active) setBusy(false);
    })().catch((e) => {
      if (active && e.name !== "RenderingCancelledException") {
        setError(e.message);
        setBusy(false);
      }
    });
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [loaded, number]);
  return (
    <section className="actual-pdf-preview" aria-label="Prévia fiel do PDF">
      <div className="pdf-page-controls">
        <strong>PDF final · mesma composição do arquivo baixado</strong>
        <div>
          <button
            type="button"
            className="secondary"
            disabled={!loaded || number === 1 || busy}
            onClick={() => setNumber((n) => n - 1)}
          >
            Página anterior
          </button>
          <span aria-live="polite">
            {loaded
              ? `Página ${number} de ${loaded.numPages}`
              : "Preparando PDF…"}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={!loaded || number === loaded.numPages || busy}
            onClick={() => setNumber((n) => n + 1)}
          >
            Próxima página
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          Não foi possível mostrar a prévia: {error}. Você pode tentar baixar o
          PDF novamente.
        </p>
      )}
      {busy && !error && <p role="status">Renderizando página…</p>}
      <div
        className="pdf-edit-surface"
        style={{ aspectRatio: `${pageSize.width}/${pageSize.height}` }}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Página ${number} do documento ${document.number}`}
          style={{ visibility: loaded ? "visible" : "hidden" }}
        />
        {freeEditor && loaded && (
          <FreeLayout
            elements={freeEditor.elements}
            onChange={freeEditor.onChange}
            page={number}
            pageSize={pageSize}
          />
        )}
      </div>
    </section>
  );
}
