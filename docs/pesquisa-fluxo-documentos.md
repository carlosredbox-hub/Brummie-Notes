# Pesquisa aplicada ao fluxo de documentos

Consulta em 15/10/2026. O objetivo é criar documentos Brummie com rapidez, preservar o visual dos originais e conferir o resultado antes de entregar ao cliente. Gestão financeira, contas a receber e servidor continuam fora do escopo.

## Fontes e aprendizados

| Fonte | O que foi observado | Aplicação no Brummie |
| --- | --- | --- |
| [PDFCraft — navegação e organização](https://github.com/storytold/pdfcraft#organize-pages-like-cards-on-a-table) | A documentação apresenta miniaturas, navegação por páginas e funcionamento local. O projeto se declara alpha; as funções documentadas não foram todas testadas por nós. | Miniaturas opcionais para localizar capa, fotos e páginas internas, sem mudar a ordem ou a composição original. |
| [pdfme — templates e geração](https://github.com/pdfme/pdfme) | Templates editáveis, geração por dados e inspeção de páginas renderizadas fazem parte do fluxo documentado. | Continuar separando conteúdo reutilizável e composição visual; conferir o PDF efetivamente gerado. |
| [Invoice Ninja — relato #11597](https://github.com/invoiceninja/invoiceninja/issues/11597) | Um usuário relata fontes diferentes entre designer e prévia por usar renderizadores diferentes. É um relato histórico, não uma avaliação de toda a versão atual. | Preservar nossa prévia do PDF real, com fontes locais, e avisar quando uma alteração ainda não entrou na prévia. |
| [Invoice Ninja — relato #13326](https://github.com/invoiceninja/invoiceninja/issues/13326) | Usuário descreve rodapé deslocado e informações distribuídas incorretamente após quebras de linha em HTML. | Continuar validando contatos em todas as páginas; não trocar o rodapé editorial por HTML arbitrário. |
| [Invoice Ninja — conversa #10564](https://github.com/invoiceninja/invoiceninja/issues/10564) | Um operador que emite para clientes relata nomes duplicados e trabalho para contornar o problema; há respostas de mantenedor. O relato inclui insatisfação de um usuário que diz usar o produto desde 2018. | Não repetir cliente, preço ou dados de contato em áreas incompatíveis do modelo. Melhorar a conferência visual, sem acrescentar gestão ao app. |
| [pdfme — relato #1396](https://github.com/pdfme/pdfme/issues/1396) | Usuário relata crescimento de tabelas, quebra de páginas e travamento no designer. A resposta explicativa é de um bot e foi tratada como tal. | Usar páginas do PDF gerado como fonte das miniaturas; não simular sua paginação apenas com elementos de formulário. |
| [pdfme — relato e reprodução #1579](https://github.com/pdfme/pdfme/issues/1579) | A discussão descreve divergência entre largura medida e largura desenhada, com sobreposição de linhas. | Não prometer detectar todo corte automaticamente. Facilitar a revisão das páginas reais e manter testes de layout. |

São fontes primárias, relatos públicos de uso e conversas de suporte. Não verifiquei a empresa ou o cargo de todos os autores: não os apresento como entrevistas com funcionários, avaliações verificadas de lojas ou uma amostra estatística. Declarações dos projetos sobre seus próprios recursos estão separadas das reclamações dos usuários. Nenhuma recomendação de desativar proteções de outro produto foi aplicada aqui.

## Mudanças desta rodada

- **Mostrar miniaturas:** navegação visual pelo PDF real, também na prévia antes de salvar. O destaque indica a página atual. As imagens e textos adicionados pelo editor livre aparecem nas miniaturas durante a edição.
- **Memória controlada:** miniaturas são opcionais, renderizadas uma por vez e em grupos de até oito. A navegação dá acesso aos grupos seguintes, sem manter todas as páginas em alta resolução na memória do celular.
- **Prévia desatualizada:** ao mudar conteúdo, tema ou enquadramento depois de visualizar, aparece um aviso para atualizar. Ajustes livres permanecem ao vivo. A conferência continua opcional e não cria uma etapa obrigatória de aprovação.
- **Android 8:** o mínimo anterior era Android 10, incompatível com o Galaxy S7 Edge informado pelo usuário. O pacote passou a permitir API26 e a reconhecer WebView antigo com uma orientação nativa de atualização. A instalação e a abertura em API26/35 passam a ser verificadas no Actions antes da publicação; o resultado de cada execução deve ser consultado, não inferido a partir do build.

A implementação é própria e não adiciona uma biblioteca de terceiros. As marcas coloridas dos documentos, o ícone branco exclusivo do app e os quatro temas continuam preservados.
