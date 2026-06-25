import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        console.log('[API-PLUGIN] Incoming:', req.method, req.url);
        next();
      });
      server.middlewares.use(async (req, res, next) => {
        const urlMatch = req.originalUrl || req.url;
        if (urlMatch?.includes('/api/generate-quiz')) {
          try {
            // Load env variables into process.env so the API can access them
            const env = loadEnv(server.config.mode, process.cwd(), '');
            Object.assign(process.env, env);

            const module = await server.ssrLoadModule('/api/generate-quiz.ts');
            const handler = module.default;
            
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost';
            const url = new URL(req.url, `${protocol}://${host}`);
            
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const body = buffers.length > 0 ? Buffer.concat(buffers) : undefined;
            
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value !== undefined) {
                headers.append(key, Array.isArray(value) ? value.join(',') : value);
              }
            }

            const request = new Request(url, {
              method: req.method,
              headers,
              body,
            });
            
            const response = await handler.fetch(request);
            
            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            
            if (response.body) {
              const reader = response.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            } else {
              res.end();
            }
          } catch (e) {
            console.error(e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Internal Server Error" }));
          }
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react")) return "react";
          return "vendor";
        },
      },
    },
  },
});
