# Windows e Android offline

Windows (Electron) e Android (WebView, Android 8+, WebView/Chrome 107+) incluem o mesmo HTML completo. Não carregam servidor remoto. O Android não declara permissão INTERNET. Cadastros, PDFs e modelos ficam no dispositivo; backup JSON exportado/restaurado é a forma de transferir os dados. A restauração substitui a biblioteca inteira após confirmação; não mescla alterações de dois dispositivos.

Windows salva PDFs e backups pelo navegador integrado. Android abre o seletor nativo para importar arquivos e escolher onde salvar, sem permissão ampla de armazenamento. O ícone do pássaro também aparece na interface e nos documentos.

## Compilar

Windows:

```sh
npm ci
npm run build
npm run test:desktop
npm run build:windows -- --publish never
```

Instalador NSIS x64 e ZIP portátil em `release/windows/`. Sem assinatura Authenticode. Builds locais Linux do NSIS precisam de Wine; o CI usa Windows.

Android exige Java 17, SDK 35 e Gradle 8.11.1:

```sh
npm ci
npm run build
mkdir -p android/app/src/main/assets
cp dist/index.html android/app/src/main/assets/index.html
cd android
gradle :app:assembleDebug -PappVersion=1.4.0
```

APK de teste em `android/app/build/outputs/apk/debug/`. O HTML gerado não é versionado; o workflow o compila para cada plataforma. Não há autoatualização. Alterações na interface exigem novo instalador.

## GitHub Actions

`.github/workflows/release.yml` valida o app e compila Windows e Android. Uma tag `vX.Y.Z` correspondente a `package.json` publica ambos somente após os jobs passarem. Execução manual gera artifacts sem publicar release. A instalação Android especifica os pacotes SDK explicitamente, evitando o pacote obsoleto `tools`.

Para assinatura Android estável, configure os quatro secrets de Actions: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`. Com todos, o CI gera APK/AAB assinado; sem eles, gera APK de teste com chave debug e marca a release como pré-release. Não há publicação na Play Store. Preserve a chave para atualizações e exporte backup antes de desinstalar.

A release anterior **v1.0.1** usa o modelo com servidor e não contém esta mudança offline. A [versão offline 1.1.0](https://github.com/carlosredbox-hub/Brummie-Notes/releases/tag/v1.1.0) foi publicada com Windows EXE/ZIP, Android TEST APK, HTML e SHA256SUMS. É uma pré-release por usar assinatura Android de teste. A biblioteca privada é transferida por backup local; os PDFs pessoais não estão nos assets públicos.

## Validação

O fluxo offline foi testado no Chromium com a rede desativada, incluindo documentos, importação e transferência de backup. A compilação Android verifica o código nativo; comportamento do seletor de arquivos e armazenamento precisa ser conferido em um dispositivo real. O smoke Electron passou no job Windows da release 1.1.0. Não foi executado nesta máquina Linux sem display; instalação em dispositivo físico permanece sem validação.

## Release Studio 1.2.1

[Baixar Windows e Android](https://github.com/carlosredbox-hub/Brummie-Notes/releases/tag/v1.2.1). Actions run38415687361 concluiu com sucesso: validação, Windows, Android e publicação. Inclui interface azul, menu focado em documentos, guias/hospedagem/propostas/horas e moldes internos editáveis. APK TEST, Windows EXE/ZIP, HTML e SHA256SUMS publicados. A biblioteca particular é importada localmente; não está nos assets públicos. Smoke Electron passou no runner Windows; instalação em aparelho físico não foi testada.

## Revisão visual 1.3.0

[Windows e Android atualizados](https://github.com/carlosredbox-hub/Brummie-Notes/releases/tag/v1.3.0). Actions run38425715323 concluiu Success em validate/windows/android/release. Inclui composição fotográfica, fontes incorporadas, Property Selection, prévia do PDF final e biblioteca de imagens extraídas dos PDFs locais. APK TEST, Windows EXE/ZIP, HTML e SHA256SUMS publicados. A biblioteca pessoal continua fora dos assets públicos. Sem validação de instalação em aparelho físico.

## APK de teste e instalação

A partir de1.4.2, os APKs TEST usam identificador próprio por versão (`com.brummie.documents.test.v1_4_2`) e nome no launcher `Brummie TEST 1.4.2`. Isso evita o conflito entre as chaves debug temporárias dos runners e mantém a instalação anterior intacta. Exporte o backup no app anterior e importe no novo para reutilizar a biblioteca. Não há migração automática entre apps distintos. Para produção e atualizações convencionais, configure os quatro secrets e preserve a chave privada de assinatura. Nenhuma chave privada é publicada no Git.

Min Android10 (API29); o código não altera nem remove apps/dados existentes. Nos APKs1.4.0/1.4.1 foi confirmado que os certificados públicos de assinatura são diferentes, por isso não podem atualizar um ao outro. A nova variante elimina essa colisão; outras causas de instalação dependem da versão do Android e da mensagem do aparelho.


## Compatibilidade Android 1.4.8

O Galaxy S7 Edge recebeu oficialmente até Android 8 (API26). APKs anteriores exigiam Android 10 (API29), portanto eram incompatíveis com esse aparelho. A partir de 1.4.8, o mínimo é Android 8. Se o aparelho ainda usa Android 6/7, precisa ser atualizado para Android 8.

O editor precisa de WebView/Chrome 107 ou superior. Em um WebView antigo, o app abre uma tela nativa com instrução de atualização, em vez de ficar parado em uma página sem funcionar. Após atualizar pela Play Store, reabra o app. Não é necessário conceder acesso amplo ao armazenamento nem conexão ao app; importar e salvar continuam usando o seletor do Android.

O APK TEST passa a usar a build release sem depuração, assinada com chave de teste e identificador separado por versão. O APK continua sendo de teste: isso não substitui uma assinatura de distribuição estável. O workflow inclui instalação e abertura do APK final em API26 e API35 antes da publicação, guardando capturas/logs em artifacts separados dos instaladores. API26 pode exibir a instrução de atualização se o WebView da imagem for antigo; API35 deve abrir o editor. Resultados desta execução devem ser conferidos no Actions, não inferidos do build local. Não houve teste físico no Galaxy S7 Edge.


## Release 1.4.9 publicada

[Windows e Android 1.4.9](https://github.com/carlosredbox-hub/Brummie-Notes/releases/tag/v1.4.9). [Actions38744455676](https://github.com/carlosredbox-hub/Brummie-Notes/actions/runs/38744455676) concluiu com sucesso: validação, Windows, Android, instalação/abertura em API26 e API35, e publicação. O teste antigo de API26 falhava ao limpar um buffer de logs antes de instalar; essa limpeza diagnóstica passou a ser opcional, sem retirar as verificações do APK e da interface. API26 pode mostrar a orientação para atualizar um WebView antigo; API35 exige a tela do editor. O APK final é uma build release, não-debuggable, assinada com chave de teste e identificador próprio desta versão. Windows continua sem Authenticode. Sem teste físico no S7 Edge.
