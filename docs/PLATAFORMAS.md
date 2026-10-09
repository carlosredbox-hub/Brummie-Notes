# Windows, Android e sincronização

O servidor existente é a única fonte de dados. Os clientes Windows (Electron com renderer sem Node) e Android (WebView nativa, Android 10+) carregam o mesmo app HTTPS. A interface é atualizada no servidor uma vez, atendendo simultaneamente às duas plataformas. Cada dispositivo mantém sua própria sessão. Use o mesmo servidor e a mesma conta para compartilhar a empresa; contas diferentes continuam isoladas.

O endereço é informado na primeira abertura e pode ser alterado no menu **Alterar servidor**. Não existe URL de produção embutida. O usuário confirmou que ainda não tem hospedagem. O servidor precisa de domínio HTTPS, Node 24+, fonte DejaVuSans, disco persistente e `COOKIE_SECURE=true`; os instaladores não hospedam o backend. Nunca inclua `.data`, senhas ou dados dos anexos nas releases.

Dados são consultados a cada 10 segundos enquanto a janela está visível, e ao retomar/recuperar conexão. Alterações são gravadas diretamente no servidor. Perda de rede é indicada e não desconecta uma sessão existente por engano; não existe edição offline ou fila de sincronização. Uma nota já emitida mantém o snapshot de motorista/veículo da emissão. O status de um documento aberto em modal deve ser revisto reabrindo-o após alteração em outro dispositivo.

Windows permite escolher fotos e baixar PDFs pelo Chromium. Android usa o seletor de imagens do sistema e DownloadManager autenticado com o cookie da sessão para salvar em Downloads. TLS e isolamento de origem são preservados; links externos HTTPS abrem no navegador. O app Android não pede acesso amplo ao armazenamento.

## Gerar instaladores

No Windows:

```sh
npm ci
npm run build:windows -- --publish never
```

Instalador NSIS x64 e ZIP portátil em `release/windows/`. Não é assinado com Authenticode, então Windows pode mostrar aviso de editor desconhecido. A versão do cliente vem de `package.json`.

Android exige Java 17, SDK 35 e Gradle 8.11.1:

```sh
cd android
gradle :app:assembleDebug -PappVersion=1.0.0
```

APK de teste em `android/app/build/outputs/apk/debug/`. Gradle é instalado pela action oficial no CI, sem script wrapper customizado. O build de teste serve para avaliação; chaves debug efêmeras de runners distintos não permitem atualização normal. Usar assinatura estável para distribuição.

## GitHub Actions e releases

`.github/workflows/release.yml` faz validação, build Windows e build Android em paralelo e só publica quando ambos terminam com sucesso. Enviar tag `vX.Y.Z` que coincida com `package.json` cria release com instalador `.exe`, ZIP portátil, APK e SHA256SUMS; com assinatura configurada inclui AAB. Execução manual gera artifacts sem publicar release. Versões Android: major ≤ 2000, minor/patch ≤ 999, código `major*1000000+minor*1000+patch`.

O workflow precisa estar commitado e enviado ao GitHub. O repositório estava sem commits antes deste trabalho; nenhum push, tag ou release remota foi realizado por esta tarefa. `GITHUB_TOKEN` do workflow fornece a permissão de releases, sem token pessoal.

Configure em **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: keystore próprio convertido para base64.
- `ANDROID_KEYSTORE_PASSWORD`: senha do keystore.
- `ANDROID_KEY_ALIAS`: alias da chave.
- `ANDROID_KEY_PASSWORD`: senha da chave.

Forneça todos os quatro juntos e mantenha a mesma chave para futuras atualizações. Não envie valores em chat ou commit. Com esses secrets o CI gera APK/AAB release assinado; sem eles gera `Android-TEST.apk` instalável e marca a release como pré-release. A chave temporária é removida do runner. Não há publicação automática na Play Store, nem autoatualização dos binários: instalar a próxima release manualmente. Alterações web chegam a ambas as plataformas após recarregar, sem nova versão nativa.

## Evidências desta tarefa

- Build web, seis testes de domínio/API/URL e smoke no navegador passaram, incluindo sincronização entre dois contextos.
- ZIP portátil Windows x64 foi gerado e seu pacote inspecionado: contém somente desktop e manifesto, sem banco ou backend. A geração local do NSIS não foi concluída por ausência de Wine no Linux; a action usa runner Windows.
- APK debug compilou com SDK 35 e JDK 17, e sua assinatura v2 foi verificada. Android 10+; ainda não foi instalado/testado em dispositivo ou emulador.
- Tentativas de smoke Electron nesta máquina sem display terminaram antes de abrir a interface; a validação nativa da tela de conexão ficou configurada no job Windows. Não há claim de teste em Windows real.
- O workflow foi validado como YAML, mas ainda não executado no GitHub. Não foram criadas releases remotas.

Os arquivos gerados localmente estão em `release/windows/Brummie-Documents-1.0.0-Windows-x64.zip` e `release/android/Brummie-Documents-1.0.0-Android-TEST.apk`. São artefatos de avaliação, ignorados pelo Git.
