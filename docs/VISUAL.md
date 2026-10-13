# Composição visual dos documentos

A revisão1.3 substitui o texto corrido por composição baseada nos PDFs de referência. A interface permanece azul; cada documento usa sua marca e cor próprias.

| Documento | Composição |
| --- | --- |
| Invoice, fatura, orçamento | Capa opcional, fotografia por serviço, informações em coluna, total destacado, pagamento e rodapé tripartido |
| Nota, voucher, recibo | Mesma identidade, fotos de motorista/veículo, informações de atendimento e preços conforme o tipo |
| Property Selection | Capa Real Estate; alternativas com foto, cidade, descrição, quartos/noites, inclusões e preço independente; sem total somado |
| Hospedagem | Capa, imagem do hotel, quadro check-in/out, fotos e detalhes dos quartos, pagamentos/saldo |
| Experiências | Capa, fotografia por experiência, programa, inclusões e pagamento |
| Home Guide | Capa, conteúdo com fotos, QR Wi-Fi e versão HTML com fontes locais |
| Horas extras | Jornada, quantidades, exceções manuais, cálculos e divergência do original |
| Internos | Demonstrativo separado, aviso confidencial na composição e rodapé |

Open Sans e Cormorant Garamond são incorporadas no PDF; licenças e origem estão em src/assets/fonts. Logos e capas vêm do material fornecido. Fotos adicionais são carregadas pelo usuário, memorizadas nos modelos e reutilizáveis. Biblioteca de PDFs permite extrair imagens raster localmente; não recria fotos nem faz OCR. Os originais anexados mantêm seu conteúdo.

A prévia usa o próprio PDF gerado com PDF.js e navegação entre páginas, em vez de uma aproximação HTML. Documentos antigos com cache de PDF são renderizados novamente na revisão visual ao abrir ou baixar, preservando seu conteúdo salvo.

Validação: tests/editorial.browser.mjs verifica duas alternativas, preços independentes, PDF real, fotos, extração de imagens do original e reutilização; tests/concierge.browser.mjs verifica também o texto final dos PDFs de hotel/horas/internos. A biblioteca privada de23 modelos foi emitida offline. Testes não substituem a avaliação visual do usuário; o PDF de exemplo demonstra composição, não disponibilidade ou orçamento confirmado.
