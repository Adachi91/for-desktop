import { Client } from "discord-rpc";

import { config } from "./config";

// internal state
let rpc: Client | undefined;

export async function initDiscordRpc() {
  if (!config.discordRpc) return;

  try {
    rpc = new Client({ transport: "ipc" });

    rpc.on("ready", () =>
      rpc.setActivity({
        state: "stoat.chat",
        details: "Chatting with others",
        largeImageKey: "qr",
        // largeImageText: "Communication is critical – use Revolt.",
        largeImageText: "",
        buttons: [
          {
            label: "Join Stoat",
            url: "https://stoat.chat/",
          },
        ],
      }),
    );

    rpc.on("disconnected", reconnect);

    rpc.login({ clientId: "872068124005007420" });
  } catch (err) {
    reconnect();
  }
}

const reconnect = () => {
  // Destroy the previous client so we do not keep stale IPC pipes alive. The
  // Discord RPC transport retries aggressively when a zombie client holds the
  // connection open, leading to a noisy connect/disconnect loop on Windows.
  rpc?.destroy();
  rpc = undefined;

  setTimeout(() => initDiscordRpc(), 1e4);
};

export async function destroyDiscordRpc() {
  rpc?.destroy();
  rpc = undefined;
}
