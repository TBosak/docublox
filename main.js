const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

process.on("uncaughtException", (error) => {
  console.error("Unexpected error: ", error);
});
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  win.loadFile("dist/docublox/browser/index.html");
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('export-pdf', async (event) => {
  console.log('Exporting to PDF...');
  const win = BrowserWindow.fromWebContents(event.sender);
  const pdfBuffer = await win.webContents.printToPDF({
    printBackground: true,
    landscape: false,
    pageSize: 'A4'
  });

  const fs = require('fs');
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save PDF',
    defaultPath: 'editor.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  }
});
