# Abrir o app no navegador

O HTML público é publicado pelo workflow **Publish browser app**, sem incorporar a biblioteca privada. Os documentos criados ficam no navegador da pessoa que usa o app.

## Ativação única pelo proprietário

1. Abra [Settings → Pages](https://github.com/carlosredbox-hub/Brummie-Notes/settings/pages).
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Abra [Publish browser app](https://github.com/carlosredbox-hub/Brummie-Notes/actions/workflows/pages.yml) e clique em **Run workflow**, escolhendo `main`.

Após o deploy concluir, o endereço será https://carlosredbox-hub.github.io/Brummie-Notes/ . Esse endereço só funciona depois da ativação e da publicação bem-sucedida.

Novas alterações no HTML público serão publicadas automaticamente. O workflow envia apenas `docs/demo/Brummie-Offline.html` como `index.html`.

A primeira tentativa foi bloqueada ao criar o site Pages: **Resource not accessible by integration**. A permissão `pages: write` do workflow permite publicar em um site ativado, mas não autoriza ativar o Pages neste repositório.
