# Windows e Android offline

Windows (Electron) e Android (WebView, Android 10+) incluem o mesmo HTML completo. Não carregam servidor remoto. O Android não declara permissão INTERNET. Cadastros, PDFs e modelos ficam no dispositivo; backup JSON exportado/restaurado é a forma de transferir os dados. A restauração substitui a biblioteca inteira após confirmação; não mescla alterações de dois dispositivos.

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
gradle :app:assembleDebug -PappVersion=1.1.0
```

APK de teste em `android/app/build/outputs/apk/debug/`. O HTML gerado não é versionado; o workflow o compila para cada plataforma. Não há autoatualização. Alterações na interface exigem novo instalador.

## GitHub Actions

`.github/workflows/release.yml` valida o app e compila Windows e Android. Uma tag `vX.Y.Z` correspondente a `package.json` publica ambos somente após os jobs passarem. Execução manual gera artifacts sem publicar release. A instalação Android especifica os pacotes SDK explicitamente, evitando o pacote obsoleto `tools`.

Para assinatura Android estável, configure os quatro secrets de Actions: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`. Com todos, o CI gera APK/AAB assinado; sem eles, gera APK de teste com chave debug e marca a release como pré-release. Não há publicação na Play Store. Preserve a chave para atualizações e exporte backup antes de desinstalar.

A release anterior **v1.0.1** usa o modelo com servidor e não contém esta mudança offline. A versão offline 1.1.0 está preparada para avaliação pelo HTML antes de gerar uma nova release.

## Validação

O fluxo offline foi testado no Chromium com a rede desativada, incluindo documentos, importação e transferência de backup. A compilação Android verifica o código nativo; comportamento do seletor de arquivos e armazenamento precisa ser conferido em um dispositivo real. O smoke Electron roda no job Windows; não é executável nesta máquina Linux sem display.
