import AutoLaunch from "auto-launch";

import { ipcMain } from "electron";

import { mainWindow } from "./window";

export const autoLaunch = new AutoLaunch({
  name: "Revolt",
});

ipcMain.on("isAutostart?", () =>
  autoLaunch
    .isEnabled()
    .then((enabled) => mainWindow.webContents.send("isAutostart", enabled)),
);

// The first argument Electron passes to IPC handlers is always the event object.
// Without grabbing the value from the second argument we would treat the
// BrowserWindowEvent as truthy and always enable autostart, so persist the flag
// and branch on the actual boolean instead.
ipcMain.on("setAutostart", (_, state: boolean) =>
  state
    ? autoLaunch.enable()
    : autoLaunch.disable(),
);
