import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const target = env.VITE_API_BASE || "http://173.249.19.250:8000"

  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 3000,
      proxy: {
        "/liveness": {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
