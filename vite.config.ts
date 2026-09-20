import { defineConfig } from "vite";

// GitHub Pages serves this repo from /<repo-name>/, so asset paths need the repo name as base.
export default defineConfig({
  base: "/mattpocock-skills-test/",
});
