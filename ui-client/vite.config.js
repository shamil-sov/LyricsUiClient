import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    base: '/LyricsUiClient/',
    plugins: [vue()],
    server: {
        port: 5173,
    },
});
