import { defineConfig, loadEnv } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [crx({ manifest })],
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? "http://localhost:3001"),
    },
  };
});
