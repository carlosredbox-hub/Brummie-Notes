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
  if (!["nightly", "total"].includes(option.priceMode || "nightly"))
    throw new Error("Forma de preço inválida.");
  const total =
    Math.round(
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
