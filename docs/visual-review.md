# Revisão visual — Aurum (Claude)

Base: `main` 5525dbb, build local, 15 exemplos completos gerados por `tests/examples.browser.mjs` (offline) e inspecionados em PNG; tamanhos de fonte medidos com `pdftotext -bbox` (altura da caixa ≈ 1,2–1,36 × corpo). Comparado com os PDFs originais recebidos (capa → foto → título → "cidade • datas" → cliente; corpo em blocos; rodapé fixo). Nenhum dado privado aqui: só exemplos fictícios da própria main.

## O que já está bom (manter)
- Capas fotográficas com logo colorido, título serifado, cliente em itálico: reproduz bem o original.
- Cards foto + texto do *Property selection* (imagem com cantos arredondados à esquerda, texto à direita) leem bem.
- Rodapé tripartido (endereço · site/contato · marca + código/paginação) em todas as páginas.
- Orçamento com foto do veículo ao lado de cada serviço é melhor que a tabela seca dos originais.

## Defeitos concretos (por prioridade)

**A1 — Catálogo 16:9, página "Condições": texto sem quebra de linha e cortado.** Uma única linha em corpo ~24 pt (`EXEMPLO com valores… Hora extra:10% da diária por hora. Confi…`) estoura a margem direita e perde o resto. Precisa quebrar linha, usar corpo ~11–12 pt, coluna máxima ~70% da largura e bullets por regra. É o único caso em que informação do cliente **some**.

**A2 — Property selection com 3 alternativas gasta 3 páginas.** Página 2 tem 2 cards e ~45% vazia; página 3 tem 1 card. Cada card ocupa ~190 pt; cabem 3 por página A4 (área útil ≈ 640 pt). Proposta: 3 cards na página 2; paginar só no 4º; título da cidade como faixa pequena (versalete 9 pt laranja) em vez de H2 de 23 pt que consome 40 pt por card.

**A3 — Metadado duplicado/solto acima do conteúdo.** Em quase todas as páginas internas aparece uma linha miúda (`CNPJ • Cidade • Brasil`) acima do título da página, repetindo o rodapé — exatamente o tipo de duplicação que o Carlos rejeitou na faixa lateral. Remover das páginas internas; deixar só no rodapé.

**A4 — Título da capa × título da página divergem.** Capa "CAR SELECTION" (inglês), página 2 "ORÇAMENTO" (português) no mesmo documento. Um único título por documento/idioma.

**A5 — Cor dos valores.** Valores em azul-app nos PDFs Lines/Real Estate; o acordo é Grafite + laranja e os originais usam texto escuro. Valores em grafite negrito; laranja só como acento (filetes, rótulos). Azul fica restrito à interface do app.

**A6 — Corpo pequeno demais.** Medido: rodapé ≈ 6 pt; blocos de orçamento/portfólio ≈ 6,5–7 pt; tabela do catálogo 16:9 ≈ 6–7 pt em slide de 842 pt de largura (ilegível ao projetar). Mínimos propostos — A4: corpo 9,5–10 pt, secundário 8,5 pt, rodapé 7 pt; 16:9: corpo 12 pt, tabela 10 pt, rodapé 8 pt.

**A7 — Página final órfã.** Orçamento: "Valor total do período" fica sozinho no topo da página 3 com dados de pagamento. O total deve fechar a página dos serviços (bloco de total alinhado à direita, com subtotal/desconto/adicional) e a página final só carregar pagamento e condições se houver espaço; senão manter junto (regra "keep-with-next" para total).

**A8 — Capa: linha de contexto mistura cidades e datas.** `Rio de Janeiro • Búzios • Angra dos Reis • 05/02/2027 • 14/02/2027` em uma linha. Separar: 1ª linha locais, 2ª período. Se houver mais de 2 cidades, "Rio de Janeiro e mais 2 destinos".

**A9 — Texto: pequenos erros tipográficos.** `Sala201`, `100 • Sala201`, `Hora extra:10%` (faltam espaços); datas `13/10/2026 — 14/10/2026` com travessão duplo espaço. Normalizar com um passe de espaçamento depois de montar a linha de endereço.

**A10 — Página vazia/pobre.** Portfólio (15) pág. 3 e Condições são ~85% brancas com texto miúdo. Combinar "incluído / programação / pagamento / informações" em duas colunas e subir para a página anterior quando couber.

## Propostas de layout (três documentos prioritários)

### 1. Seleção de propriedades (3 alternativas) — A4 retrato
- Capa: logo (altura 56 pt) · foto 55% da altura · título 22 pt · locais · período · cliente.
- Corpo: 3 cards/página. Card = foto 150×110 pt à esquerda (cantos 6 pt), à direita: faixa pequena `CIDADE · CÓDIGO` (8,5 pt, laranja, versalete), título 12 pt negrito, linha `6 suítes · 8 banheiros · até N hóspedes` (9 pt), descrição 3 linhas (9,5 pt), duas colunas de dados (Período · Valor total) e link como botão texto. Separador filete 0,5 pt.
- Preço por alternativa sempre rotulado "Alternativa A/B/C"; nenhum total global (já decidido). Última página: "Condições" + contato do consultor.

### 2. Proposta comercial com vários serviços — 16:9
- Slide 1 capa (foto lateral 40% + marca). Slide 2 resumo do evento (data, local, pax) em 3 cartões de números. Slides 3+: matriz serviço × categoria com cabeçalho 10 pt e linhas 11 pt, **no máximo 8 linhas por slide** (senão continua em outro slide, repetindo cabeçalho). Slide final: condições em bullets 12 pt + assinatura/contato. Total em barra destacada, nunca em linha de corpo.

### 3. Catálogo/tarifário de veículos — 16:9, 3×2
- Cada card: foto 100%, nome 12 pt, 1 linha de capacidade; selo "Blindado" quando aplicável. Tarifas em tabela abaixo (corpo 10 pt) com grupos "Transfer / Disposição / Hora extra"; a regra "hora extra = 10% da diária/hora" como nota fixa do rodapé da tabela. Marca do parceiro só se informada (sem placeholder `Hotel de demonstração` no cabeçalho de exemplos reais).

## Casos de teste visuais sugeridos (para o Atlas)
1. 3 imóveis × texto longo (descrição 900 caracteres) → quebra e paginação sem corte.
2. 6 imagens no mesmo serviço → grade 3×2, sem sobreposição de rodapé.
3. 12 serviços de orçamento → total na última página de serviços (A7).
4. Catálogo com 9 veículos → 2 slides; condições com 800 caracteres → quebra (A1).
5. Regressão automática: nenhuma palavra do PDF com `xMax` > largura da página − margem (detecta A1), corpo mínimo por tipo (A6), e ausência de linhas de metadado repetidas (A3).

## Simplicidade do fluxo
O menu único "Novo documento → Exemplo completo" funciona bem para ensinar. Falta, na criação, um passo "Marca + família" antes dos campos (3 marcas × ~8 famílias) com a prévia sempre visível, e salvar "como modelo" a partir da prévia sem sair dela.

## Limites desta revisão
Revisei a main por PNGs dos PDFs gerados e por medição de texto; **não** testei o editor interativo (arraste/posição) nem o app em aparelho. Comparação com originais: pelas capas/páginas que recebi, sem pixel a pixel.
