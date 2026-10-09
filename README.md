# Brummie Documents

App de documentos para transporte executivo, com cadastro de empresas independentes, clientes, motoristas e veículos. Emite invoices, faturas, orçamentos, vouchers, notas informativas e recibos em PDF. Interface responsiva em português e documentos em português/inglês.

## Executar

Requer Node.js 24 e a fonte `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` disponível na imagem preparada.

```sh
cd /workspace/Brummie-Notes
npm ci --cache /workspace/.npm-cache
npm run dev
```

O servidor atende a porta 3000. Crie uma conta na tela inicial (nenhuma senha padrão), configure sua empresa, cadastre motorista/veículo com fotos JPG/PNG e gere documentos. Uma conta cria seu próprio espaço empresarial; não existe convite para equipe compartilhada nesta versão.

```sh
npm run build
npm test
npm start
```

`PORT` configura a porta; `DB_PATH` configura a localização do SQLite, cujo padrão é `.data/brummie.sqlite`. O banco e fotos são locais, persistentes e ignorados pelo Git. Faça backup do SQLite e proteja o diretório de dados. Fotos fazem parte dos cadastros e são copiadas para os documentos emitidos. Dados da empresa e dos serviços ficam registrados na emissão; alterações futuras dos cadastros não reescrevem documentos anteriores.

Para publicação use um host Node persistente, disco durável e HTTPS; configure `COOKIE_SECURE=true` atrás de HTTPS. A execução local não publica o app. Antes de oferecer como SaaS público, implementar recuperação/verificação de e-mail, convites e papéis de equipe, política de retenção, backups operacionais e gestão de sessão. Não há integração fiscal, envio automático de e-mail/WhatsApp, assinatura digital ou pagamentos.

## Validação

`npm test` verifica cálculos dos exemplos, validação de desconto e recibo, criação de conta, autorização, isolamento entre empresas, snapshots e geração de PDF. `tests/browser.mjs` é o smoke test visual e funcional, executável com Playwright e Chromium instalado no caminho indicado.

Leia [referências e limites](docs/REFERENCIAS.md) para a análise dos anexos e o estado da pesquisa externa. Os anexos originais ficam fora do checkout. Não foram importados dados pessoais dos exemplos.

## Windows e Android

As versões nativas usam o mesmo servidor HTTPS configurável e compartilham os dados da mesma conta. O GitHub Actions gera ambos os instaladores por tag. Veja [plataformas, assinatura e releases](docs/PLATAFORMAS.md). O endereço do servidor não vem embutido e o backend precisa ser hospedado separadamente.
