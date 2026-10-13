import React, { useRef, useState } from "react";
export function FreeLayout({ elements, onChange, page, pageSize }) {
  const layer = useRef(null);
  const [selected, setSelected] = useState(null);
  const patch = (id, values) =>
    onChange(elements.map((e) => (e.id === id ? { ...e, ...values } : e)));
  function drag(event, element) {
    event.preventDefault();
    setSelected(element.id);
    const target = event.currentTarget,
      bounds = layer.current.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      left: element.x,
      top: element.y,
    };
    target.setPointerCapture(event.pointerId);
    target.onpointermove = (move) =>
      patch(element.id, {
        x: Math.max(
          0,
          Math.min(0.95, start.left + (move.clientX - start.x) / bounds.width),
        ),
        y: Math.max(
          0,
          Math.min(0.95, start.top + (move.clientY - start.y) / bounds.height),
        ),
      });
    target.onpointerup = () => {
      target.onpointermove = null;
      target.onpointerup = null;
    };
  }
  return (
    <div className="free-layout-layer" ref={layer}>
      {elements
        .filter((e) => e.page === page)
        .map((e) => (
          <div
            key={e.id}
            role="button"
            tabIndex={0}
            aria-label={`Mover ${e.kind === "image" ? "imagem" : e.text}`}
            className={`free-element ${selected === e.id ? "selected" : ""}`}
            onPointerDown={(event) => drag(event, e)}
            style={{
              left: `${e.x * 100}%`,
              top: `${e.y * 100}%`,
              width: e.kind === "image" ? `${e.width * 100}%` : undefined,
              color: e.color,
              fontFamily: "BrummieFreeSans",
              fontSize: `${((e.size || 14) / pageSize.width) * 100}cqw`,
              whiteSpace: "pre",
              lineHeight: 1.15,
            }}
          >
            {e.kind === "image" ? (
              <img src={e.data} alt="Imagem livre" draggable={false} />
            ) : (
              e.text
            )}
          </div>
        ))}
    </div>
  );
}
