/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx)"],
  addons: ["@storybook/addon-docs", "@chromatic-com/storybook"],
  framework: "@storybook/react-vite",
  // The Vite framework reuses ../vite.config.js, which is where the
  // per-project aliases (@dollies, @world, ...) live.
};
export default config;
