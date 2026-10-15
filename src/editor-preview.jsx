import { documentCompany } from "./document-branding.js";
import React, { useState, useRef } from "react";
import { PdfPreview } from "./pdf-preview.jsx";
import { validateDoc } from "./editorial-document.js";
import { documentThemes } from "./document-themes.js";

const elementId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `element-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function EditorPreview({ draft, company, onChange }) {
  const history = useRef({ past: [], future: [], last: 0 });
  function changeElements(elements) {
    const h = history.current;
    if (Date.now() - h.last > 500)
      h.past = [
        ...h.past.slice(-79),
        structuredClone(draft.freeElements || []),
      ];
    h.last = Date.now();
    h.future = [];
    onChange({ ...draft, freeElements: elements });
  }
  function undo() {
    const h = history.current;
    if (!h.past.length) return;
    h.future.push(structuredClone(draft.freeElements || []));
    h.last = 0;
    onChange({ ...draft, freeElements: h.past.pop() });
  }
  function redo() {
    const h = history.current;
    if (!h.future.length) return;
    h.past.push(structuredClone(draft.freeElements || []));
    h.last = 0;
    onChange({ ...draft, freeElements: h.future.pop() });
  }
  const [preview, setPreview] = useState(null),
    [error, setError] = useState("");
  const previewSource = useRef(null);
  const stale =
    preview &&
    previewSource.current &&
    (previewSource.current.company !== company ||
      [
        ...new Set([
          ...Object.keys(draft),
          ...Object.keys(previewSource.current.draft),
        ]),
      ].some(
        (key) =>
          key !== "freeElements" &&
          draft[key] !== previewSource.current.draft[key],
      ));
  const commercial = draft.proposal?.layout === "commercial";
  function refresh() {
    try {
      const prepared = validateDoc({
        ...draft,
        client: draft.client || "Cliente — prévia",
        email: draft.email || "",
      });
      previewSource.current = { draft: { ...draft }, company };
      setPreview({
        ...prepared,
        company: documentCompany(company, draft.brand),
        theme: draft.theme || company.documentTheme || "basic",
        number: draft.number || 1,
        id: "editor-preview",
        examplePreview: true,
        draftPreview: true,
        freeElements: [],
        previewRevision: Date.now(),
      });
      setError("");
    } catch (e) {
      setError(`Preencha os campos necessários para a prévia: ${e.message}`);
    }
  }
  return (
    <section className="form-section editor-live-preview">
      <h3>Conferir a composição antes de finalizar</h3>
      <p>
        Confira todas as páginas do PDF sem salvar. Depois de alterar textos,
        fotos ou posições, atualize a prévia.
      </p>
      <div className="form-grid">
        <label>
          Tema do documento
          <select
            value={draft.theme || "default"}
            onChange={(e) =>
              onChange({
                ...draft,
                theme:
                  e.target.value === "default" ? undefined : e.target.value,
              })
            }
          >
            <option value="default">Usar padrão atual</option>
            {Object.entries(documentThemes).map(([id, t]) => (
              <option key={id} value={id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {!commercial && (
          <label>
            Posição das fotos nos blocos
            <select
              value={draft.visualLayout?.imagePosition || "left"}
              onChange={(e) =>
                onChange({
                  ...draft,
                  visualLayout: {
                    ...draft.visualLayout,
                    imagePosition: e.target.value,
                  },
                })
              }
            >
              <option value="left">Foto à esquerda · texto à direita</option>
              <option value="right">Texto à esquerda · foto à direita</option>
            </select>
          </label>
        )}
        {!commercial && (
          <label>
            Enquadramento das fotos nos blocos
            <select
              value={draft.visualLayout?.imageFit || "crop"}
              onChange={(e) =>
                onChange({
                  ...draft,
                  visualLayout: {
                    ...draft.visualLayout,
                    imageFit: e.target.value,
                  },
                })
              }
            >
              <option value="crop">Preencher o espaço</option>
              <option value="contain">Mostrar a imagem inteira</option>
            </select>
          </label>
        )}
      </div>
      <p className="muted">
        A capa mantém sua composição; catálogos de veículos usam a grade de
        fotos.
      </p>
      <button type="button" className="secondary" onClick={refresh}>
        {preview ? "Atualizar prévia" : "Visualizar antes de finalizar"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {stale && (
        <p className="preview-stale" role="status">
          A prévia está desatualizada. Clique em Atualizar prévia para conferir
          suas últimas alterações.
        </p>
      )}
      {preview && (
        <>
          <details className="free-tools">
            <summary>Edição visual livre · opcional</summary>
            <div className="free-history">
              <button
                type="button"
                className="secondary"
                disabled={!history.current.past.length}
                onClick={undo}
              >
                Desfazer ajuste livre
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!history.current.future.length}
                onClick={redo}
              >
                Refazer ajuste livre
              </button>
            </div>
            <p>
              Adicione textos e imagens e arraste sobre a página. Ajustes ficam
              no documento e no modelo. Os blocos originais são editados nos
              campos acima.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                changeElements([
                  ...(draft.freeElements || []),
                  {
                    id: elementId(),
                    kind: "text",
                    text: "Texto livre",
                    page: 1,
                    x: 0.1,
                    y: 0.1,
                    size: 14,
                    color: "#142f62",
                  },
                ])
              }
            >
              Adicionar texto livre
            </button>
            <label>
              Adicionar imagem livre
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !["image/png", "image/jpeg"].includes(file.type) ||
                    file.size > 10 * 1024 * 1024
                  ) {
                    setError("Use PNG ou JPEG de até 10 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    changeElements([
                      ...(draft.freeElements || []),
                      {
                        id: elementId(),
                        kind: "image",
                        data: reader.result,
                        page: 1,
                        x: 0.1,
                        y: 0.2,
                        width: 0.3,
                      },
                    ]);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </label>
            {(draft.freeElements || []).map((element) => (
              <div className="free-element-tools" key={element.id}>
                {element.kind === "text" && (
                  <label>
                    Texto livre
                    <input
                      value={element.text}
                      onChange={(e) =>
                        changeElements(
                          draft.freeElements.map((x) =>
                            x.id === element.id
                              ? { ...x, text: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                )}
                <label>
                  Página
                  <input
                    type="number"
                    min="1"
                    value={element.page}
                    onChange={(e) =>
                      changeElements(
                        draft.freeElements.map((x) =>
                          x.id === element.id
                            ? {
                                ...x,
                                page: Math.max(1, Number(e.target.value) || 1),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  {element.kind === "image" ? "Largura (%)" : "Fonte (pt)"}
                  <input
                    type="number"
                    min="1"
                    max={element.kind === "image" ? 100 : 100}
                    value={
                      element.kind === "image"
                        ? Math.round(element.width * 100)
                        : element.size
                    }
                    onChange={(e) =>
                      changeElements(
                        draft.freeElements.map((x) =>
                          x.id === element.id
                            ? {
                                ...x,
                                ...(x.kind === "image"
                                  ? {
                                      width: Math.max(
                                        0.01,
                                        Math.min(
                                          1,
                                          Number(e.target.value) / 100,
                                        ),
                                      ),
                                    }
                                  : {
                                      size: Math.max(
                                        1,
                                        Math.min(100, Number(e.target.value)),
                                      ),
                                    }),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    changeElements(
                      draft.freeElements.filter((x) => x.id !== element.id),
                    )
                  }
                >
                  Remover elemento
                </button>
              </div>
            ))}
          </details>
          <PdfPreview
            document={preview}
            freeEditor={{
              elements: draft.freeElements || [],
              onChange: changeElements,
            }}
          />
        </>
      )}
    </section>
  );
}
