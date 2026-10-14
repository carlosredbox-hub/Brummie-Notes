# Proposta composta: imóveis, transporte e náutica

Lidos o PDF de cinco páginas e o ZIP com cinco imagens de `Orçamento - New Time`. O PDF original foi preservado integralmente na biblioteca privada; os materiais recebidos não são instruções para efetuar reservas ou contratar serviços.

O documento reúne cinco imóveis, quatro alternativas de transporte e dois passeios náuticos. O modelo editável usa opções independentes, sem somar alternativas de imóveis, veículos e barcos. Novos campos permitem escolher categoria, qualificador “a partir de”, fotos complementares e versões inglesas do título, descrição, inclusões e período. As observações da proposta também aceitam uma versão inglesa opcional.

A interface mantém **Português** e **English** como escolhas por documento. Não há mistura obrigatória dos dois idiomas na mesma página. Campos ingleses preenchidos são usados ao selecionar English; textos personalizados sem tradução preservam o original, em vez de receber uma tradução automática não conferida. Rótulos e formatação de moeda respeitam o idioma. Cabeçalhos fixos do tarifário comercial também foram ajustados para inglês.

Cuidados da importação:

- Os valores de transporte estão vazios no original: permanecem “sob consulta”, nunca zero fabricado.
- O yacht tem preço **a partir de**; o catamaran tem valor informado, sem esse qualificador.
- Códigos, datas, links, capacidades, duração, tripulação e porto foram preservados.
- O BR-RJ094 imprime “8.9 banheiros”: mantido e sinalizado para conferência, sem correção arbitrária.
- As versões inglesas são textos editáveis de apoio. A descrição portuguesa original continua guardada.
- Fotos do yacht/catamaran são preservadas em galeria complementar, além da imagem principal.

Biblioteca privada: 31 modelos e 15 referências, mantendo registros anteriores. Dados do cliente, valores reais e links privados não são publicados no Git. O HTML genérico do repositório contém o editor, sem incorporar essa biblioteca privada.

## Logos e fundo branco

Arquivos originais das marcas continuam intactos. Uma logo com fundo branco é preservada nos documentos claros; não se deve remover esse fundo globalmente. Nos temas azul/escuro, apenas um fundo branco opaco conectado às bordas da imagem é limpo na composição, para evitar a placa branca destoante. Arte já transparente permanece intacta, assim como as cores da marca. A regra é aplicada somente a logos, não às fotos dos documentos. Ícone branco continua exclusivo do app.

[Comparação visual dos fundos](examples/logo-backgrounds.md) · [Exemplo composto em português e inglês](examples/mixed-language/README.md).

Validação: testes de unidade, seleção editorial e quatro temas; proposta New Time emitida em português e inglês, conferindo alternativas, preço mínimo, valores ausentes e detalhes náuticos. Modelos anteriores permanecem disponíveis. Mudanças desta rodada publicadas na release v1.4.5, com Windows, Android de teste e HTML offline. A validação e os dois builds passaram no GitHub Actions.
