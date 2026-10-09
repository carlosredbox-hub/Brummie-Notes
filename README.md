# Brummie Offline Studio

Facilitador local para transporte executivo. Gera invoices, faturas, orçamentos, vouchers, notas informativas e recibos em português ou inglês. Não conecta ao site Brummie, não exige conta e não precisa de servidor ou internet para funcionar.

## Testar antes de instalar

```sh
npm ci
npm run build
```

Abra `dist/index.html` em Chrome ou Edge. O arquivo único contém interface, ícone, gerador de PDF e leitor de PDFs. Não precisa de arquivos auxiliares. Use sempre o mesmo navegador e endereço/caminho para manter o espaço local; exporte backup antes de mover o HTML. Navegação privada ou limpeza de dados do navegador pode apagar seus registros.

- **Meus modelos:** exemplos editáveis baseados nos documentos fornecidos e modelos que você salvar. Reutilizar preenche cliente, serviços, valores, motorista e veículo; reposiciona as datas a partir de hoje, mantendo os intervalos entre serviços, para revisão.
- **Importar PDF anterior:** preserva o arquivo original na biblioteca e extrai texto localmente. Revise cliente, descrição e valor antes de salvar o modelo. A sugestão de preço usa o maior valor monetário encontrado; não reconstrói todas as linhas automaticamente. PDFs digitalizados precisam de preenchimento manual, sem OCR. Limite: 25 MB e 150 páginas, sem senha.
- **Novo documento:** cadastros locais, itens, adicionais, descontos e emissão de PDF. Clientes utilizados ficam memorizados. Nota de atendimento permite nome, idiomas e foto do motorista, foto e placa do veículo. Não há emissão fiscal oficial.
- **Exportar backup / Restaurar backup:** inclui documentos, modelos, cadastros, fotos e PDFs originais. A restauração substitui os dados locais após confirmação (máximo 150 MB). Guarde o backup em local privado.

Se o visualizador bloquear o armazenamento, o app entra em **modo de prévia em memória**, com aviso visível. Nesse modo as alterações duram somente enquanto a página estiver aberta; exporte backup antes de fechar. Se o visualizador não executar JavaScript, abra o HTML no Chrome/Edge.

No modo normal, dados ficam no IndexedDB do dispositivo. O armazenamento disponível depende do navegador e do espaço em disco. Windows e Android usam o mesmo app, mas cada dispositivo tem sua própria biblioteca: transfira um backup para levar os dados ao outro dispositivo. Não há sincronização automática offline.

## Desenvolvimento e validação

Node.js 24. `npm run dev` inicia Vite na porta 3000 para desenvolvimento; `npm start` serve a compilação local. Esses comandos são opcionais para o HTML pronto. `npm run desktop` abre a versão Electron após o build.

```sh
npm test
npm run build
npm run test:browser
npm run test:preview
```

O teste de navegador roda com rede desativada e verifica emissão de PDF, persistência, reutilização, importação, preservação exata do PDF original, backup em outro contexto e layout móvel. Chromium/Playwright deve estar instalado. Testes legados de API ainda verificam o backend histórico em `server.js`; ele não é usado pelo app offline nem empacotado nos instaladores. Esses testes exigem a fonte DejaVuSans.

Veja [plataformas e releases](docs/PLATAFORMAS.md) e [referências dos documentos](docs/REFERENCIAS.md). Os anexos originais e dados pessoais não são publicados no Git nem na release genérica. O [HTML com biblioteca privada](docs/BIBLIOTECA.md) incorpora os documentos autorizados pelo usuário apenas no arquivo local de avaliação.
