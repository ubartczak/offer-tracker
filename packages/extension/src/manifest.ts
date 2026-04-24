import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest((env) => {
  const dev = env.mode === "development";
  const iconDir = dev ? "icons/dev" : "icons";

  return {
  manifest_version: 3,
  name: dev ? "Offer Tracker [DEV]" : "Offer Tracker",
  version: "1.0.0",
  description: "Śledź swoje aplikacje o pracę jednym kliknięciem",

  action: {
    default_popup: "src/popup/popup.html",
    default_icon: {
      "16": `${iconDir}/icon16.png`,
      "48": `${iconDir}/icon48.png`,
      "128": `${iconDir}/icon128.png`,
    },
  },

  background: {
    service_worker: "src/background/background.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: [
        "https://www.linkedin.com/jobs/*",
        "https://justjoin.it/*",
        "https://www.pracuj.pl/*",
      ],
      js: ["src/content/content.ts"],
      run_at: "document_idle",
    },
  ],

  permissions: ["storage", "activeTab"],

  host_permissions: [
    "http://localhost:3001/*",
    "https://*.railway.app/*",
  ],
  };
});
