package com.brummie.documents;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.inputmethod.InputMethodManager;
import android.util.DisplayMetrics;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private byte[] pendingFile;
    private String pendingMime;
    private final AtomicBoolean saving = new AtomicBoolean(false);
    private final ExecutorService files = Executors.newSingleThreadExecutor();
    private static final int PICK_FILE = 101, SAVE_FILE = 102;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        Matcher engine = Pattern.compile("Chrome/(\\d+)").matcher(settings.getUserAgentString());
        if (!engine.find() || Integer.parseInt(engine.group(1)) < 107) {
            showWebViewUpdate();
            return;
        }
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        web.addJavascriptInterface(new Files(), "BrummieAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setTitle("Confirmar")
                    .setMessage(message)
                    .setPositiveButton("Confirmar", (dialog, which) -> result.confirm())
                    .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                String[] accepted = params.getAcceptTypes();
                if (accepted != null && accepted.length > 0 && !accepted[0].isEmpty() && !accepted[0].startsWith("."))
                    intent.putExtra(Intent.EXTRA_MIME_TYPES, accepted);
                try {
                    startActivityForResult(Intent.createChooser(intent, "Selecionar arquivo local"), PICK_FILE);
                } catch (Exception e) {
                    chooser.onReceiveValue(null);
                    chooser = null;
                }
                return true;
            }
        });
        setAppView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void setAppView(View view) {
        FrameLayout host = new FrameLayout(this);
        host.addView(view, new FrameLayout.LayoutParams(-1, -1));
        setContentView(host);
        // Android 15 enforces edge-to-edge. Older Android uses the normal
        // window and adjustResize; applying IME padding there would count it twice.
        if (Build.VERSION.SDK_INT >= 35) {
            host.setOnApplyWindowInsetsListener((target, insets) -> {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                target.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            });
            host.requestApplyInsets();
        }
    }

    private void showWebViewUpdate() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);
        TextView message = new TextView(this);
        message.setTextSize(18);
        message.setText("Atualize o Android System WebView ou o Chrome pela Play Store e reabra o Brummie. O editor precisa de WebView 107 ou superior. Seus documentos continuam no aparelho; o app funciona offline depois da atualização.");
        layout.addView(message);
        for (String provider : new String[]{"com.google.android.webview", "com.android.chrome"}) {
            Button update = new Button(this);
            update.setText(provider.equals("com.android.chrome") ? "Atualizar Chrome" : "Atualizar WebView");
            update.setOnClickListener(v -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + provider)));
                } catch (Exception e) {
                    toast("Abra a Play Store e atualize o WebView ou Chrome.");
                }
            });
            layout.addView(update);
        }
        ScrollView scroll = new ScrollView(this);
        scroll.addView(layout);
        setAppView(scroll);
    }

    private void toast(String message) {
        if (!isDestroyed()) Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    public class Files {
        @JavascriptInterface public void saveFile(String name, String mime, String base64) {
            if (!saving.compareAndSet(false, true)) {
                runOnUiThread(() -> toast("Conclua o salvamento anterior."));
                return;
            }
            files.execute(() -> {
                try {
                    byte[] bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
                    String type = ("application/pdf".equals(mime) || "text/html".equals(mime)) ? mime : "application/json";
                    runOnUiThread(() -> {
                        if (isDestroyed() || isFinishing()) { saving.set(false); return; }
                        pendingFile = bytes;
                        pendingMime = type;
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType(type);
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        intent.putExtra(Intent.EXTRA_TITLE, name.replaceAll("[^a-zA-Z0-9._-]", "_"));
                        try {
                            startActivityForResult(intent, SAVE_FILE);
                        } catch (Exception e) {
                            pendingFile = null;
                            saving.set(false);
                            toast("Não foi possível abrir o seletor de arquivos.");
                        }
                    });
                } catch (Exception e) {
                    saving.set(false);
                    runOnUiThread(() -> toast("Não foi possível preparar o arquivo."));
                }
            });
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && chooser != null) {
            chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            chooser = null;
        }
        if (request != SAVE_FILE) return;
        byte[] bytes = pendingFile;
        String mime = pendingMime;
        pendingFile = null;
        pendingMime = null;
        if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) {
            saving.set(false);
            return;
        }
        Uri destination = data.getData();
        toast("Salvando arquivo…");
        files.execute(() -> {
            try (OutputStream output = getContentResolver().openOutputStream(destination)) {
                if (output == null) throw new java.io.IOException("Destino indisponível");
                output.write(bytes);
                output.flush();
            } catch (Exception e) {
                saving.set(false);
                runOnUiThread(() -> toast("Falha ao salvar. Tente novamente."));
                return;
            }
            saving.set(false);
            runOnUiThread(() -> {
                if (isDestroyed() || isFinishing()) return;
                if (!"application/pdf".equals(mime)) { toast("Arquivo salvo."); return; }
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("PDF salvo")
                    .setMessage("Deseja compartilhar o documento?")
                    .setNegativeButton("Concluído", null)
                    .setPositiveButton("Compartilhar", (dialog, which) -> {
                        Intent share = new Intent(Intent.ACTION_SEND);
                        share.setType("application/pdf");
                        share.putExtra(Intent.EXTRA_STREAM, destination);
                        share.setClipData(ClipData.newRawUri("PDF", destination));
                        share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        try { startActivity(Intent.createChooser(share, "Compartilhar PDF")); }
                        catch (Exception e) { toast("PDF salvo. Nenhum app disponível para compartilhar."); }
                    }).show();
            });
        });
    }

    @Override public void onBackPressed() {
        View root = getWindow().getDecorView();
        boolean keyboard;
        if (Build.VERSION.SDK_INT >= 30 && root.getRootWindowInsets() != null) {
            keyboard = root.getRootWindowInsets().isVisible(WindowInsets.Type.ime());
        } else {
            Rect visible = new Rect();
            root.getWindowVisibleDisplayFrame(visible);
            DisplayMetrics display = new DisplayMetrics();
            getWindowManager().getDefaultDisplay().getRealMetrics(display);
            keyboard = display.heightPixels - visible.bottom > 100 * display.density;
        }
        if (keyboard) {
            InputMethodManager input = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            input.hideSoftInputFromWindow(root.getWindowToken(), 0);
            return;
        }
        if (web == null || web.getUrl() == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(function(){var e=new Event('brummie-back',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;})()", handled -> {
            if (isDestroyed() || "true".equals(handled)) return;
            if (web.canGoBack()) web.goBack(); else MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (chooser != null) chooser.onReceiveValue(null);
        if (web != null) web.destroy();
        files.shutdown();
        super.onDestroy();
    }
}
