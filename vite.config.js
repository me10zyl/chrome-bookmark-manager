import {build, defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from 'node:url'
import path from 'node:path'
import {viteSingleFile} from "vite-plugin-singlefile";
// https://vite.dev/config/
export default defineConfig({
    build: {
        sourcemap: true
        // rollupOptions: {
        //     input: {
        //         main: 'index.html',  // 主入口文件
        //         contentScript: './src/contentScript/contentScript.ts',  // 需要单独打包的文件
        //         background: './src/background.ts'
        //     },
        //     output: {
        //         entryFileNames: (chunkInfo) => {
        //             if (chunkInfo.name === 'contentScript') {
        //                 return 'contentScript.js';  // 保持文件名为 custom.js
        //             }else if(chunkInfo.name === 'background'){
        //                 return 'background.js'
        //             }
        //             return 'assets/main-[hash].js';  // 其他文件的命名规则
        //         }
        //     }
        // }
    },
    plugins: [vue()],
    resolve:
        {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
})