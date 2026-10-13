import sans from "./assets/fonts/OpenSans-Regular.ttf?inline";
import sansBold from "./assets/fonts/OpenSans-Bold.ttf?inline";
import sansItalic from "./assets/fonts/OpenSans-Italic.ttf?inline";
import sansBoldItalic from "./assets/fonts/OpenSans-BoldItalic.ttf?inline";
import serif from "./assets/fonts/Cormorant-Regular.ttf?inline";
import serifBold from "./assets/fonts/Cormorant-Bold.ttf?inline";
import serifItalic from "./assets/fonts/Cormorant-Italic.ttf?inline";
import serifBoldItalic from "./assets/fonts/Cormorant-BoldItalic.ttf?inline";

export function registerPdfFonts(pdf) {
  for (const [family, fonts] of [
    ["OpenSans", [sans, sansBold, sansItalic, sansBoldItalic]],
    ["Cormorant", [serif, serifBold, serifItalic, serifBoldItalic]],
  ]) {
    fonts.forEach((data, index) => {
      const file = `${family}-${index}.ttf`;
      pdf.addFileToVFS(file, data.slice(data.indexOf(",") + 1));
      pdf.addFont(
        file,
        family,
        ["normal", "bold", "italic", "bolditalic"][index],
      );
    });
  }
}
