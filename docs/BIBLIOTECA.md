# Biblioteca privada de documentos anteriores

O app aceita uma biblioteca embutida no HTML offline por `window.__BRUMMIE_REFERENCE_PACK__`. O pacote inclui PDFs originais como base64, texto extraído, modelos com itens individuais, clientes, categorias de veículo e contatos recorrentes. A importação é local, aditiva e aplicada uma única vez por identificador de pacote. Não sobrescreve documentos existentes nem dados preenchidos da empresa. Exclusões posteriores não são desfeitas ao recarregar.

Os PDFs e informações pessoais fornecidos pelo usuário ficam fora do Git. Para preparar um HTML privado após `npm run build`:

```sh
node scripts/build-reference-html.mjs /caminho/privado/references.json /caminho/privado/Brummie-Referencias.html
node tests/references.browser.mjs /caminho/privado/Brummie-Referencias.html /caminho/privado/references.json
```

Formato do pacote: `{schema:1,id:"identificador-estavel",company:{address,phone,website},records:[...]}`. Registros archive contêm `{id,kind:"archive",name,text,source:{type:"application/pdf",base64},created}`. Registros template contêm `{id,kind:"template",name,sourceId,sourceIds,content}`; content usa a validação de documentos de `domain.js`. `referenceReview` sinaliza ambiguidades e revisão necessária sem ser impresso como observação para o cliente. Um PDF com várias opções pode originar vários modelos separados; PDFs duplicados podem compartilhar um modelo com `sourceIds`.

O teste privado verifica todos os PDFs por SHA256, abre e emite cada modelo com a rede desativada, confirma preços e quantidade de serviços, intervalos de datas, biblioteca em tela móvel e ausência de duplicação após recarga. Também produz um backup JSON inicial ao lado do HTML, contendo a biblioteca sem os documentos de teste. Esse backup é compatível com Restaurar backup; a restauração substitui os dados existentes após confirmação.

Ao reutilizar, as datas dos serviços partem de hoje e mantêm seus intervalos. O original e as datas históricas permanecem na biblioteca. Valores são referências históricas e não tabelas de preço vigentes. Fotos, nomes de motoristas, placas e números reais de passageiros não são inferidos a partir de fotografias ilustrativas ou capacidades de veículos.
