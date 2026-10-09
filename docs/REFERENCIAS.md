# Materiais e decisões de produto

Foram lidos os 20 arquivos `.htm` enviados. Apesar da extensão, seus conteúdos são texto simples com links, sem marcação HTML, folhas de estilo ou imagens. A navegação e os campos informaram a organização em visão geral, documentos, clientes, motoristas e frota; não é possível afirmar reprodução fiel do visual dessas páginas.

O ZIP `7017126658290576627.zip` contém oito PDFs: invoices Anna Hardenberg, Huth e Selections (um duplicado); vouchers Anna e Huth; orçamentos João Paulo e Gleica. Foram extraídos os textos de todos e inspecionada visualmente uma página de invoice. Os documentos mostram capa, identificação do cliente, itinerário, datas, imagens, valores, total, informações bancárias e rodapé. Na primeira versão, nenhum dado bancário ou cadastro pessoal foi importado automaticamente. Após o usuário pedir explicitamente os PDFs como dados, foi preparada uma biblioteca privada descrita abaixo. O segundo ZIP, `2433588138858096089.zip`, ultrapassa o limite de transferência de 32 MiB e não pôde ser lido.

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

## Biblioteca privada solicitada pelo usuário

O primeiro ZIP reenviado contém os mesmos oito PDFs, relidos integralmente. O HTML privado inclui oito originais, onze modelos, cinco clientes e quatro categorias de veículos; a versão genérica no Git não contém esses dados pessoais. As duas invoices Selections compartilham um modelo, preservando os dois originais. Orçamentos com opções de veículo foram separados para evitar somar alternativas. Cada data explicitamente listada virou um serviço; passageiros não informados devem ser confirmados, sem tratar capacidade como ocupação.

Foram conferidos totais de helicóptero R$ 49.600, helicóptero com bagagens R$ 50.800 e Meet & Greet R$ 3.350. O roteiro de João Paulo separa sedan (quatro serviços, R$ 1.600) de van (nove serviços, R$ 15.200). Gleica separa sedan não blindado (R$ 5.500), sedan blindado (R$ 7.800), SUV (R$ 10.400) e guia bilíngue opcional (R$ 1.300), com a condição de 10% por hora excedente indicada no texto. Esses totais de roteiro são calculados a partir das linhas, não totais impressos no orçamento.

O PDF Gleica contém divergência entre fevereiro na capa e janeiro nas linhas. Os modelos sinalizam a divergência. A data do guia não está explicitamente indicada; usa-se uma data inicial editável com aviso de confirmação. Não há placa ou motorista identificado para cadastrar automaticamente. Consulte [biblioteca privada](BIBLIOTECA.md) para empacotar e validar dados sem enviá-los ao Git. O segundo ZIP reenviado ainda excede o limite de transferência de 32 MiB; seus PDFs não foram analisados.
