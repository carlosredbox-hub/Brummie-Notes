const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");
let window;
function open() {
  window = new BrowserWindow({
    width: 1380,
    height: 960,
    minWidth: 390,
    minHeight: 600,
    title: "Brummie • Offline Studio",
    icon: path.join(__dirname, "../src/assets/icon.png"),
    backgroundColor: "#f6f8f7",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (e) => e.preventDefault());
  window.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Brummie",
        submenu: [
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
  window.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(open);
app.on("window-all-closed", () => app.quit());
