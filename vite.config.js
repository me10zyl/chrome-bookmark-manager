import {build, defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from 'node:url'
import path from 'node:path'
import {viteSingleFile} from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
// https://vite.dev/config/
export default defineConfig({
    server: {
        port: 4444,
    },
    plugins: [
        react()
    ],
    css: {
        modules: {
            localsConvention: 'camelCase', // 或 'camelCaseOnly'
            generateScopedName: '[local]__[hash:base64:5]',
        },
    },
    build: {
        sourcemap: true,
        outDir: 'dist2',
        rollupOptions: {
            input: {
                main: 'index.html',  // 主入口文件
            }
        },
        resolve:
            {
                alias: {
                    '@': fileURLToPath(new URL('./src', import.meta.url))
                }
            }
    }
})