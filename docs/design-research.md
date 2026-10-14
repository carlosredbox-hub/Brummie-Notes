# Remasterização editorial discreta — Brummie

Pesquisa e revisão em 14/10/2026. Objetivo: polir os documentos existentes, preservando a alma dos exemplos enviados. As referências abaixo foram efetivamente consultadas; não são uma lista de artistas usada apenas como decoração.

## Referências e aplicação

| Referência | O que foi observado | Aplicação na Brummie |
| --- | --- | --- |
| [Edward Tufte / Dave Liepmann — Tufte CSS](https://github.com/edwardtufte/tufte-css/blob/gh-pages/index.html) | Hierarquia tipográfica, pouco ruído e integração próxima entre imagem e texto. O próprio projeto distingue sua solução web de impressão. | Manter foto junto ao serviço/imóvel; melhorar ritmo dos cards, sem acrescentar adornos, gráficos ou uma nova linguagem visual. |
| [Christian Thalmann — Cormorant](https://github.com/CatharsisFonts/Cormorant/blob/master/README.md) | Família de **display** inspirada na tradição de Garamond, desenhada como projeto próprio; licença OFL. | Preservar Cormorant nos títulos e destaques editoriais, não usá-la para reduzir descrições e tabelas a texto ornamental pequeno. |
| [Steve Matteson e colaboradores — Open Sans](https://github.com/googlefonts/opensans/blob/main/README.md) | Autoria e desenvolvimento da família já usada pelo app. | Preservar Open Sans nos dados, descrições e valores. A combinação com Cormorant mantém continuidade com a versão anterior. |
| [GOV.UK Design System — tipografia](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/font-override-classes/index.md) e [títulos](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/headings/index.md) | Hierarquia consistente, negrito seletivo, texto de leitura alinhado à esquerda, evitar justificação forçada e tratar palavras longas. Números tabulares ajudam comparações. | Descrições continuam alinhadas à esquerda; títulos/preços têm destaque sem colocar tudo em negrito; condições longas quebram em linhas e páginas. Não copiar a escala em pixels da web como se fosse norma de impressão. |
| [MDN — contraste e WCAG](https://github.com/mdn/content/blob/main/files/en-us/web/accessibility/guides/understanding_wcag/perceivable/color_contrast/index.md) | Referência de 4,5:1 para texto normal e 3:1 para texto grande; tamanho e fundo precisam ser considerados juntos. | Revisar textos nos quatro fundos, mantendo as paletas e sem recolocar cartões brancos atrás de logos. Esta revisão não equivale a certificação WCAG/PDF acessível. |
| [Stripe — funcionamento de invoices](https://docs.stripe.com/invoicing/overview) e [personalização](https://docs.stripe.com/invoicing/customize) | Identificação e numeração, discriminação dos serviços, idioma do cliente, notas e rodapé são parte do documento; personalização não substitui conteúdo correto. | Preservar campos e numeração; separar aparência dos cálculos e manter revisão antes de emitir. Referência de prática de faturamento, sem integrar Stripe ou transformar o app em emissor fiscal. |
| [Revisão visual de Aurum / Claude](visual-review.md) | Inspeção dos 15 PDFs, com problemas concretos de legibilidade e paginação. | Incorporar achados compatíveis com um polimento discreto; propostas de novo layout ficam fora desta rodada. |

Tentativas de acesso direto a Vignelli, Pentagram, Cooper Hewitt, Material e W3C foram bloqueadas pela política de rede. Não apresentamos essas páginas como material lido. A pesquisa aproveitou fontes abertas disponíveis no GitHub, incluindo documentação mantida pelos próprios projetos.

## Padrão profissional adotado

Não existe uma fonte ou tamanho obrigatório universal para propostas comerciais, notas informativas de atendimento, seleção de imóveis ou portfólios. Normas de trabalhos acadêmicos não são uma regra automática para estes documentos. Exigências fiscais/contratuais dependem do tipo real do documento e da jurisdição; o app emite documentos informativos, conforme a decisão do usuário.

A escala abaixo é uma decisão editorial deste produto, não uma alegação de norma legal:

| Elemento | Escala usada | Critério |
| --- | --- | --- |
| Título de capa | até 26 pt, ajustável ao comprimento | Preservar a capa e a assinatura visual original. |
| Título de página A4 | 24 pt | Hierarquia clara, com ajuste discreto de 1 pt. |
| Cidade em seleção de propriedades | 17 pt | Continua serifada e sobre a imagem; não foi substituída por um rótulo minúsculo. |
| Título de card | 11 pt | Distinguir nome do serviço/imóvel da descrição. |
| Corpo de leitura | 10 pt | Substitui os 9 pt dos cards, mantendo os demais textos principais de 10 pt. |
| Dados do card | 9,5 pt por padrão | Valores destacados mantêm tamanhos próprios; campos explicitamente secundários podem ser menores. |
| Tarifário 16:9 | 8 pt nas linhas; 7 pt no cabeçalho de colunas; 9 pt nas condições | Pequeno aumento para a matriz densa original. Não vender esse PDF como apresentação legível a distância: para projeção seria necessário outro layout, que alteraria demais o original. |
| Rodapé A4 | 7 pt por padrão | Preservar contatos, endereço, marca e paginação. Textos excepcionalmente longos ainda podem ser reduzidos pelo encaixe; não esconder dados para cumprir um tamanho nominal. |

Moedas continuam formatadas pelo idioma/moeda do documento, com centavos conforme os valores. Datas, cliente, serviços, validade, condições, pagamento, desconto e adicional opcional continuam sendo informações estruturadas; preços de imóveis são alternativas independentes, não um total cumulativo. Fontes seguem incorporadas ao PDF para evitar substituição de fonte no computador do cliente. A4 retrato e comercial 16:9 permanecem distintos.

## Mudanças aplicadas e limites

- Cards: descrição de 9 para 10 pt, dados padrão de 9 para 9,5 pt; intervalos mais consistentes, sem diminuir as fotos.
- Cidade e card reservam espaço juntos antes da quebra de página, evitando deixar o título da cidade sozinho.
- Tarifário: aumento moderado dos textos; condições paginam linha a linha e repetem o cabeçalho quando necessário.
- Capas: local e período ficam em linhas separadas quando ambos existem. Títulos automáticos respeitam o idioma; título personalizado continua sendo preservado.
- Título de página de 25 para 24 pt, mantendo as duas famílias tipográficas originais.
- Valores usam a tinta de leitura do tema (grafite/navy); o dourado permanece nos valores do tema escuro. Acentos muito claros ficam na decoração. Corrigidos espaços em exemplos/defaults, sem alterar textos pessoais importados.
- Cache de PDFs gerados atualizado; arquivos de referência importados não são reescritos.

Mantidos: logos transparentes/coloridas, fotografias, geometria geral das capas, cards com foto lateral, cantos arredondados, quatro paletas, tabela comercial e grade 3×2, todos os campos e rodapés. Ícone branco permanece exclusivo do app.

Não adotamos nesta rodada: nova capa lateral, cards de resumo, duas colunas para todos os textos, nova família de fontes ou retirada automática dos dados do cliente. A linha de identificação do cliente não deve ser removida apenas por parecer com os dados da empresa no rodapé: são informações diferentes. Nem todos os três imóveis caberão numa única página, especialmente com descrições longas; preservar texto e fotos tem prioridade sobre um número fixo de páginas.

## Verificação desta rodada

Build e 20 testes de unidade passaram. Os 15 exemplos completos passaram offline, verificando fotos e rodapés; regressões dos quatro temas passaram. Prévia, posicionamento, arraste, desfazer/refazer e persistência foram verificados durante a rodada. Os 60 PDFs finais somam 169 páginas, sem texto fora dos limites físicos da página na inspeção de coordenadas. Condições comerciais extensas foram testadas em seis páginas: frase final preservada e sem palavras fora das margens. Esses testes não substituem a avaliação estética; compare os exemplos [antes/depois na galeria](examples/README.md).
