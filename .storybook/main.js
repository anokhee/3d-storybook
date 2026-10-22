/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx)"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  // public/ is served at the site root: the Catalog's thumbnails live there.
  staticDirs: ["../public"],
  // The Vite framework reuses ../vite.config.js, which is the
  // place to add an alias or plugin if one is ever needed.
  // The dev server answers to localhost and 127.0.0.1 (Vite refuses other
  // hostnames unless listed).
  viteFinal: (config) => ({
    ...config,
    server: { ...config.server, allowedHosts: ["localhost", "127.0.0.1"] },
  }),
  features: {
    // Storybook's "Get started" checklist, in the sidebar and the menu: off.
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
};
export default config;
