# Materiais e decisões de produto

Foram lidos os 20 arquivos `.htm` enviados. Apesar da extensão, seus conteúdos são texto simples com links, sem marcação HTML, folhas de estilo ou imagens. A navegação e os campos informaram a organização em visão geral, documentos, clientes, motoristas e frota; não é possível afirmar reprodução fiel do visual dessas páginas.

O ZIP `7017126658290576627.zip` contém oito PDFs: invoices Anna Hardenberg, Huth e Selections (um duplicado); vouchers Anna e Huth; orçamentos João Paulo e Gleica. Foram extraídos os textos de todos e inspecionada visualmente uma página de invoice. Os documentos mostram capa, identificação do cliente, itinerário, datas, imagens, valores, total, informações bancárias e rodapé. Nenhum dado bancário ou cadastro pessoal foi importado automaticamente. O segundo ZIP, `2433588138858096089.zip`, ultrapassa o limite de transferência de 32 MiB e não pôde ser lido.

## Variantes contempladas

- Invoice: cobrança em português ou inglês, moeda BRL/USD/EUR, prazo e pagamento.
- Fatura: múltiplos serviços de um mesmo cliente em um documento.
- Orçamento: proposta com prazo de validade e condições.
- Voucher: confirmação com serviços e informações operacionais, sem preços.
- Nota informativa: motorista, idiomas, fotos, veículo, placa e instruções, sem preços. O usuário confirmou que não deseja nota fiscal nesta etapa.
- Recibo: pagamento deve estar confirmado para emissão.
- Serviço: transfer IN/OUT, entre cidades, disposição 5/10/24 horas, helicóptero, bagagens, meet & greet, guia bilíngue, vans e eventos. Descrições adicionais são livres.
- Preço: serviço, passageiro, veículo, hora, dia ou km, quantidade, adicionais e desconto. Valores não são convertidos entre moedas; cada documento utiliza uma única moeda.
- Status: rascunho, emitido, pago, cancelado. Baixar ou gerar PDF não significa enviar ao cliente. Recibos não alteram o pagamento de invoices automaticamente.

## Pesquisa externa: pendente por bloqueio de rede

Tentativas de leitura em 09/10/2026 receberam HTTP 403 do proxy:

- https://docs.stripe.com/invoicing/overview — processo de invoice e pagamento.
- https://www.gov.br/nfse/pt-br — distinção entre documentos informativos e NFS-e.
- https://help.blacklane.com/en/articles/2691547-how-do-i-find-my-chauffeur-at-the-airport — orientação de encontro com motorista. URL candidata ainda não confirmada.

Esses domínios foram acrescentados ao rascunho de rede preservando os presets existentes. Os sites ainda não foram consultados com sucesso; o conteúdo não é citado como evidência. A taxonomia acima deriva dos anexos acessíveis e das decisões de implementação, e não pretende cobrir todas as variantes existentes no mercado.
