const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  shell,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { serverUrl } = require("./url.cjs");
let window, server;
const config = () => path.join(app.getPath("userData"), "connection.json");
const settingsPage = path.join(__dirname, "connection.html");
function setup() {
  const previous = window;
  window = new BrowserWindow({
    width: 650,
    height: 550,
    title: "Brummie • Conectar servidor",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  if (previous) previous.close();
  window.loadFile(settingsPage);
  Menu.setApplicationMenu(null);
}
function external(url) {
  try {
    const u = new URL(url);
    if (["https:", "mailto:"].includes(u.protocol)) shell.openExternal(url);
  } catch {}
}
function open(url) {
  server = serverUrl(url);
  const previous = window;
  window = new BrowserWindow({
    width: 1380,
    height: 940,
    minWidth: 390,
    minHeight: 600,
    title: "Brummie Documents",
    backgroundColor: "#f6f8f7",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  if (previous) previous.close();
  window.webContents.setWindowOpenHandler(({ url }) => {
    external(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (e, url) => {
    if (new URL(url).origin !== server) {
      e.preventDefault();
      external(url);
    }
  });
  window.webContents.on("will-redirect", (e, url) => {
    if (new URL(url).origin !== server) e.preventDefault();
  });
  window.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  window.webContents.on(
    "did-fail-load",
    (_event, code, description, _url, mainFrame) => {
      if (mainFrame && code !== -3) {
        dialog.showErrorBox(
          "Servidor indisponível",
          "Verifique sua conexão e o endereço HTTPS. " + description,
        );
        setup();
      }
    },
  );
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Brummie",
        submenu: [
          { label: "Alterar servidor", click: setup },
          { label: "Recarregar", role: "reload" },
          { type: "separator" },
          { label: "Sair", role: "quit" },
        ],
      },
      {
        label: "Editar",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "Exibir",
        submenu: [
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "togglefullscreen" },
        ],
      },
    ]),
  );
  window.loadURL(server).catch(() => {});
}
ipcMain.handle("connect", async (event, value) => {
  if (
    event.sender !== window?.webContents ||
    !event.sender.getURL().startsWith("file:")
  )
    return { error: "Operação não permitida." };
  try {
    const url = serverUrl(value);
    fs.writeFileSync(config(), JSON.stringify({ server: url }));
    open(url);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
});
app.whenReady().then(() => {
  try {
    open(JSON.parse(fs.readFileSync(config(), "utf8")).server);
  } catch {
    setup();
  }
});
app.on("window-all-closed", () => app.quit());
