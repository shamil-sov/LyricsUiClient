import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    base: '/LyricsUiClient/',
    plugins: [vue()],
    server: {
        port: 5173,
        proxy: {
            '/oauth': {
                target: 'https://accounts-test.bandlab.com',
                changeOrigin: true,
            },
        },
    },
});
