import { isCommercial } from "./commercial-model.js";
import { validateDoc as validateBase } from "../domain.js";
export const isSelection = (d) =>
  d?.type === "proposta" && d.proposal?.layout === "property-selection";
export function calculateOption(option) {
  const rooms = Number(option.rooms),
    nights = Number(option.nights),
    rate = Number(option.nightlyRate || 0),
    fixed = Number(option.totalPrice || 0);
  if (
    !option.title?.trim() ||
    !Number.isInteger(rooms) ||
    rooms < 1 ||
    rooms > 10000 ||
    !Number.isInteger(nights) ||
    nights < 1 ||
    nights > 10000 ||
    ![rate, fixed].every((v) => Number.isFinite(v) && v >= 0)
  )
    throw new Error(
      "Revise título, quartos, noites e preço de cada alternativa.",
    );
  if (
    !["nightly", "total", "onrequest"].includes(option.priceMode || "nightly")
  )
    throw new Error("Forma de preço inválida.");
  for (const key of ["suites", "bathrooms"])
    if (option[key] !== undefined && option[key] !== "") {
      const n = Number(option[key]);
      if (
        !Number.isFinite(n) ||
        n < 0 ||
        (key === "suites" && !Number.isInteger(n))
      )
        throw new Error("Revise suítes e banheiros da opção.");
    }
  if (option.link && !/^https?:\/\//i.test(option.link))
    throw new Error("O link do imóvel deve começar com https:// ou http://.");
  const total =
    option.priceMode === "onrequest"
      ? null
      : Math.round(
          (option.priceMode === "total" ? fixed : rooms * nights * rate) * 100,
        ) / 100;
  return {
    ...option,
    rooms,
    nights,
    nightlyRate: rate,
    totalPrice: fixed,
    total,
  };
}
export function validateDoc(doc) {
  if (isCommercial(doc)) {
    const c = doc.proposal.commercial;
    if (
      !c ||
      !c.title?.trim() ||
      !Array.isArray(c.columns) ||
      !c.columns.length ||
      c.columns.length > 8 ||
      c.columns.some((x) => !x?.trim()) ||
      !c.groups?.length
    )
      throw new Error("Revise título, categorias e grupos do tarifário.");
    for (const g of c.groups) {
      if (!g.title?.trim() || !g.rows?.length)
        throw new Error("Cada grupo precisa de título e serviços.");
      for (const r of g.rows) {
        if (
          !r.label?.trim() ||
          !Array.isArray(r.prices) ||
          r.prices.length !== c.columns.length ||
          r.prices.some(
            (v) => v !== null && (!Number.isFinite(Number(v)) || Number(v) < 0),
          )
        )
          throw new Error("Revise serviços e valores da tabela.");
      }
    }
    if (c.fleet?.some((v) => !v.name?.trim()))
      throw new Error("Informe os nomes dos veículos do catálogo.");
    if (Number(doc.cardFeePct || 0) || Number(doc.discount || 0))
      throw new Error(
        "Tarifário não soma alternativas nem aplica desconto global.",
      );
    return {
      ...validateBase({
        ...doc,
        items: [
          { description: doc.proposal.title, quantity: 1, price: 0, extra: 0 },
        ],
        discount: 0,
        cardFeePct: 0,
      }),
      commercial: true,
    };
  }
  if (!isSelection(doc)) return validateBase(doc);
  if (!doc.proposal.options?.length)
    throw new Error("Inclua pelo menos uma opção de hospedagem.");
  if (Number(doc.cardFeePct || 0) || Number(doc.discount || 0))
    throw new Error(
      "Seleção de alternativas não tem desconto nem adicional global.",
    );
  const options = doc.proposal.options.map(calculateOption);
  const normalized = validateBase({
    ...doc,
    items: [
      { description: doc.proposal.title, quantity: 1, price: 0, extra: 0 },
    ],
    discount: 0,
    cardFeePct: 0,
  });
  return {
    ...normalized,
    proposal: { ...normalized.proposal, options },
    total: 0,
    selection: true,
  };
}
