import linesLogo from "./assets/lines-logo.png";
import estateLogo from "./assets/realestate-logo.png";
import linesCover from "./assets/lines-cover.jpeg";
import estateCover from "./assets/realestate-cover.jpeg";
import { brands } from "./presets.js";
export const brandProfiles = brands;
export function documentCompany(company, brand = "lines") {
  const { brandProfiles: profiles, ...baseCompany } = company;
  const configured = profiles?.[brand] || {};
  return {
    ...baseCompany,
    ...(brand === "lines" ? {} : brandProfiles[brand]),
    ...configured,
    logo:
      configured.logo ||
      (brand === "lines"
        ? company.logo || (company.name === "Brummie Lines" ? linesLogo : "")
        : brand === "realestate" || brand === "luxury"
          ? estateLogo
          : ""),
    coverImage:
      configured.coverImage || (brand === "lines" ? linesCover : estateCover),
    brand,
  };
}
export const conciergeTypes = {
  guia: "Home Guide",
  hospedagem: "Voucher de hospedagem",
  proposta: "Proposta de experiência",
  horas: "Horas extras",
  interno: "Documento interno",
};
