import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: '../..',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /three[\\/]build[\\/]three\.core\.js$/ },
            { name: 'three-renderer', test: /three[\\/]build[\\/]three\.module\.js$/ }
          ]
        }
      }
    }
  },
  server: { port: 5173 }
});

