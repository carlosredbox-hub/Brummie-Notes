# Edição visual offline

A criação usa modelos, quatro temas e a prévia do PDF antes de salvar. Fotos dos blocos podem ficar à esquerda ou à direita, com preenchimento ou enquadramento inteiro. A capa e o catálogo em grade conservam suas composições próprias.

Na edição, clique **Visualizar antes de finalizar**, abra **Edição visual livre** e adicione textos ou imagens. Arraste os elementos na página, escolha a página, ajuste fonte/largura, remova, desfaça ou refaça. Os elementos adicionados são gravados com o documento/modelo e incorporados no PDF exportado. Textos e fotos dos blocos originais continuam editáveis pelos campos do modelo; este modo não reescreve arbitrariamente objetos de um PDF importado.

## Referência

A referência solicitada é [storytold/pdfcraft](https://github.com/storytold/pdfcraft), examinada no commit `7437bde378f43856eada40af25b983812e615e8a`: README, arquitetura, `crates/ui-egui/src/canvas.rs`, `crates/ui-egui/src/drag_pointer.rs` e `crates/ui-egui/tests/object_selection.rs`. Inspirou a separação entre composição renderizada, elementos selecionáveis, coordenadas da página, histórico de ajustes e exportação local. A implementação Brummie usa React, PDF.js e pdf-lib já existentes; nenhum código, marca ou motor Rust do PdfCraft foi copiado ou integrado.

O perfil de usuário e o botão de saída foram removidos. As identidades das marcas continuam disponíveis para gerar os documentos Lines, Luxury e Real Estate.
