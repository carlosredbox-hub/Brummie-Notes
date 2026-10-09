package com.brummie.documents;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView web;
    private String server;
    private ValueCallback<Uri[]> chooser;
    private static final int FILE_REQUEST = 101;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().getDecorView().setOnApplyWindowInsetsListener((v,insets)->{
            v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        server = getPreferences(MODE_PRIVATE).getString("server", "");
        if (server.isEmpty()) setup(""); else open();
    }
    private TextView text(String value,int size) { TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setPadding(0,18,0,18);return t; }
    private void setup(String error) {
        if (web!=null) { web.destroy();web=null; }
        setTitle("Brummie • Conectar");
        LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);int pad=(int)(24*getResources().getDisplayMetrics().density);layout.setPadding(pad,pad,pad,pad);
        layout.addView(text("Um servidor. Todos os dispositivos.",24));
        layout.addView(text("Informe o mesmo endereço HTTPS usado no Windows e entre com a mesma conta.",16));
        EditText url=new EditText(this);url.setSingleLine(true);url.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);url.setHint("https://app.suaempresa.com");url.setText(server);layout.addView(url);
        Button connect=new Button(this);connect.setText("Conectar");layout.addView(connect);
        TextView message=text(error,14);layout.addView(message);
        connect.setOnClickListener(v->{try{Uri u=Uri.parse(url.getText().toString().trim());if(!"https".equals(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||!(u.getPath()==null||u.getPath().isEmpty()||"/".equals(u.getPath())))throw new IllegalArgumentException();server=u.buildUpon().path("").build().toString();getPreferences(MODE_PRIVATE).edit().putString("server",server).apply();open();}catch(Exception e){message.setText("Informe a raiz de um servidor HTTPS válido.");}});
        setContentView(layout);
    }
    private boolean sameOrigin(Uri u) { Uri base=Uri.parse(server);return "https".equals(u.getScheme())&&base.getHost().equalsIgnoreCase(u.getHost()==null?"":u.getHost())&&(base.getPort()==-1?443:base.getPort())==(u.getPort()==-1?443:u.getPort()); }
    private void open() {
        setTitle("Brummie Documents");web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSupportMultipleWindows(false);CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri u=request.getUrl();if(sameOrigin(u))return false;if("https".equals(u.getScheme())||"mailto".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(MainActivity.this,"Nenhum app disponível para abrir este link.",Toast.LENGTH_SHORT).show();}}return true;}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())view.post(()->setup("Servidor indisponível. Verifique a conexão e o endereço."));}
            @Override public void onPageFinished(WebView view,String url){CookieManager.getInstance().flush();}
        });
        web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;Intent intent=new Intent(Intent.ACTION_GET_CONTENT);intent.setType("image/*");intent.addCategory(Intent.CATEGORY_OPENABLE);try{startActivityForResult(Intent.createChooser(intent,"Selecionar foto"),FILE_REQUEST);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;}return true;}});
        web.setDownloadListener((url,userAgent,disposition,mime,length)->{Uri uri=Uri.parse(url);if(!sameOrigin(uri))return;try{String name=android.webkit.URLUtil.guessFileName(url,disposition,mime).replaceAll("[^a-zA-Z0-9._-]","_");DownloadManager.Request request=new DownloadManager.Request(uri);String cookies=CookieManager.getInstance().getCookie(url);if(cookies!=null)request.addRequestHeader("Cookie",cookies);request.addRequestHeader("User-Agent",userAgent);request.setMimeType(mime);request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS,name);((DownloadManager)getSystemService(DOWNLOAD_SERVICE)).enqueue(request);Toast.makeText(this,"PDF sendo salvo em Downloads.",Toast.LENGTH_LONG).show();}catch(Exception e){Toast.makeText(this,"Não foi possível baixar o PDF.",Toast.LENGTH_LONG).show();}});
        setContentView(web);web.loadUrl(server);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==FILE_REQUEST&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);chooser=null;}}
    @Override public boolean onCreateOptionsMenu(Menu menu){menu.add("Alterar servidor");menu.add("Recarregar");return true;}
    @Override public boolean onOptionsItemSelected(MenuItem item){if("Alterar servidor".contentEquals(item.getTitle()))setup("");else if(web!=null)web.reload();return true;}
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);if(web!=null)web.destroy();super.onDestroy();}
}
