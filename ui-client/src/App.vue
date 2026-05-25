<script setup>
import { ref, provide } from 'vue';
import ConfigPanel from './components/ConfigPanel.vue';
import TriggerPanel from './components/TriggerPanel.vue';
import LogPanel from './components/LogPanel.vue';

const apiBaseUrl = ref('https://u00eqnitv3.execute-api.ap-southeast-1.amazonaws.com');
const bearerToken = ref('');

const httpLogs = ref([]);

function addLog(entry) {
    httpLogs.value.unshift({ id: Date.now() + Math.random(), ts: new Date().toLocaleTimeString(), ...entry });
    if (httpLogs.value.length > 200) httpLogs.value.length = 200;
}

async function loggedFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const entry = { method, url, requestHeaders: { ...options.headers }, requestBody: options.body };

    try {
        const res = await fetch(url, options);
        const cloned = res.clone();
        let responseBody;
        try { responseBody = await cloned.text(); } catch { responseBody = '<unreadable>'; }

        addLog({
            ...entry,
            status: res.status,
            statusText: res.statusText,
            responseBody,
            ok: res.ok,
        });
        return res;
    } catch (err) {
        addLog({ ...entry, status: 0, statusText: 'Network Error', responseBody: err.message, ok: false });
        throw err;
    }
}

provide('loggedFetch', loggedFetch);

function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (bearerToken.value) h['Authorization'] = `Bearer ${bearerToken.value}`;
    return h;
}
</script>

<template>
    <div class="app">
        <h1>🎵 Lyrics Transcription — Test Client</h1>

        <ConfigPanel v-model:apiBaseUrl="apiBaseUrl" v-model:bearerToken="bearerToken" />

        <TriggerPanel
            :apiBaseUrl="apiBaseUrl"
            :authHeaders="authHeaders"
        />

        <LogPanel :logs="httpLogs" @clear="httpLogs = []" />
    </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1117;
    color: #e0e0e0;
    padding: 24px;
}

.app {
    max-width: 960px;
    margin: 0 auto;
}

h1 {
    margin-bottom: 24px;
    font-size: 1.6rem;
    color: #fff;
}

h2 {
    font-size: 1.1rem;
    margin-bottom: 12px;
    color: #ccc;
}

input, textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #333;
    border-radius: 6px;
    background: #1a1d27;
    color: #e0e0e0;
    font-size: 0.9rem;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #5b8def;
}

button {
    padding: 8px 18px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: #5b8def;
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    background: #4a7de0;
}

.btn-secondary {
    background: #2a2d37;
    color: #ccc;
    border: 1px solid #444;
}

.btn-secondary:hover:not(:disabled) {
    background: #353840;
}

.btn-danger {
    background: #e05555;
    color: #fff;
}

.btn-danger:hover:not(:disabled) {
    background: #c94444;
}

.card {
    background: #1a1d27;
    border: 1px solid #2a2d37;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

.status-enqueued { background: #3a3520; color: #f0c040; }
.status-transcribing { background: #1a2e40; color: #5bb8ef; }
.status-completed { background: #1a3520; color: #5bef7b; }
.status-failed { background: #3a1a1a; color: #ef5b5b; }

.error-text { color: #ef5b5b; font-size: 0.85rem; margin-top: 8px; }
</style>
