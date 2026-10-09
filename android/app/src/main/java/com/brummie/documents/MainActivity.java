package com.brummie.documents;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private byte[] pendingFile;
    private static final int PICK_FILE=101, SAVE_FILE=102;
    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);setTitle("Brummie • Offline Studio");
        getWindow().getDecorView().setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
        web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setAllowFileAccessFromFileURLs(false);s.setAllowUniversalAccessFromFileURLs(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new Files(),"BrummieAndroid");
        web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}});
        web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;Intent intent=new Intent(Intent.ACTION_GET_CONTENT);intent.setType("*/*");intent.addCategory(Intent.CATEGORY_OPENABLE);String[] accepted=params.getAcceptTypes();if(accepted!=null&&accepted.length>0&&!accepted[0].isEmpty()&&!accepted[0].startsWith("."))intent.putExtra(Intent.EXTRA_MIME_TYPES,accepted);try{startActivityForResult(Intent.createChooser(intent,"Selecionar arquivo local"),PICK_FILE);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;}return true;}});
        setContentView(web);web.loadUrl("file:///android_asset/index.html");
    }
    public class Files {
        @JavascriptInterface public void saveFile(String name,String mime,String base64){runOnUiThread(()->{try{if(pendingFile!=null){Toast.makeText(MainActivity.this,"Conclua o salvamento anterior.",Toast.LENGTH_SHORT).show();return;}pendingFile=android.util.Base64.decode(base64,android.util.Base64.DEFAULT);Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/pdf".equals(mime)?mime:"application/json");intent.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^a-zA-Z0-9._-]","_"));startActivityForResult(intent,SAVE_FILE);}catch(Exception e){pendingFile=null;Toast.makeText(MainActivity.this,"Não foi possível preparar o arquivo.",Toast.LENGTH_LONG).show();}});}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==PICK_FILE&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);chooser=null;}if(request==SAVE_FILE){if(result==RESULT_OK&&data!=null&&pendingFile!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){out.write(pendingFile);Toast.makeText(this,"Arquivo salvo.",Toast.LENGTH_SHORT).show();}catch(Exception e){Toast.makeText(this,"Falha ao salvar. Tente novamente.",Toast.LENGTH_LONG).show();}}pendingFile=null;}}
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);if(web!=null)web.destroy();super.onDestroy();}
}
