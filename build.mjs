import {build, defineConfig} from 'vite';
import * as config from './vite.config.js'
import vue from "@vitejs/plugin-vue";
import { access, rm, mkdir,rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SrcDirname = 'src';
const DistDirname = 'dist';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcPath = resolve(__dirname, SrcDirname);
const distPath = resolve(__dirname, DistDirname);

const entryPoints = [
    { inputName: 'background', inputPath: resolve(srcPath, 'background/background.ts') },
    { inputName: 'contentScript', inputPath: resolve(srcPath, 'contentScript/contentScript.ts') },
    { inputName: 'popup', inputPath: resolve('index.html')},
];

const isWatch = process.argv.some(arg => arg.includes('--watch'));

function getConfig(inputName, inputPath) {
    return defineConfig({
        base: './',
        build: {
            watch: isWatch,
            emptyOutDir: false,
            sourcemap: true,
            rollupOptions: {
                input: {
                    [inputName]: inputPath,
                },
                output: {
                    inlineDynamicImports: true,
                    entryFileNames: '[name].bundle.js',
                    chunkFileNames: '[name].chunk.js',
                    assetFileNames: '[name][extname]',
                }
            }
        },
        plugins: [],
        resolve:
            {
                alias: {
                    '@': fileURLToPath(new URL('./src', import.meta.url))
                }
            }
    })
}

async function start(){
    try {
        await access(distPath); // check dist directory exists
        await rm(distPath, { recursive: true, force: true }); // if exists clear the
        // whole before all builds
    } catch {} // I don't care about errors here
    for(const entryPoint of entryPoints){
        await build(getConfig(entryPoint.inputName, entryPoint.inputPath));
    }
}

await start();