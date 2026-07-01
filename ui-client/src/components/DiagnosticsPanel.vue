<script setup>
import { ref, computed, inject } from 'vue';

const loggedFetch = inject('loggedFetch');

const props = defineProps({
    apiBaseUrl: String,
    authHeaders: Function,
});

const inputMode = ref('url');
const trackUrl = ref('');
const directPostId = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);

const postId = computed(() => {
    if (inputMode.value === 'postid') {
        const val = directPostId.value.trim();
        const uuid = val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        return uuid ? uuid[0] : '';
    }
    try {
        const url = new URL(trackUrl.value);
        const parts = url.pathname.split('/');
        const trackIdx = parts.indexOf('track');
        if (trackIdx >= 0 && parts[trackIdx + 1]) return parts[trackIdx + 1];
        const uuid = trackUrl.value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return uuid ? uuid[0] : '';
    } catch {
        const uuid = trackUrl.value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return uuid ? uuid[0] : '';
    }
});

async function fetchDiagnostics() {
    if (!postId.value || !props.apiBaseUrl) return;
    loading.value = true;
    error.value = '';
    result.value = null;
    try {
        const res = await loggedFetch(
            `${props.apiBaseUrl}/synced-lyrics/${postId.value}/diagnostics`,
            { headers: props.authHeaders() }
        );
        if (res.status === 401) {
            throw new Error('Access denied (401). You must be a beta user to view diagnostics. Ask Shamil to add your user ID to the list of beta users.');
        }
        if (res.status === 404) {
            throw new Error('No transcription job found for this post ID.');
        }
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }
        result.value = await res.json();
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}

function reset() {
    trackUrl.value = '';
    directPostId.value = '';
    result.value = null;
    error.value = '';
}

const formatted = computed(() =>
    result.value ? JSON.stringify(result.value, null, 2) : ''
);
</script>

<template>
    <div class="card">
        <h2>🔬 Diagnostics</h2>

        <div class="input-mode-toggle">
            <label :class="{ active: inputMode === 'url' }">
                <input type="radio" v-model="inputMode" value="url" /> Track URL
            </label>
            <label :class="{ active: inputMode === 'postid' }">
                <input type="radio" v-model="inputMode" value="postid" /> Post ID
            </label>
        </div>

        <div class="input-row">
            <input
                v-if="inputMode === 'url'"
                v-model="trackUrl"
                placeholder="Paste BandLab track URL"
                @keyup.enter="fetchDiagnostics()"
                :disabled="loading"
            />
            <input
                v-else
                v-model="directPostId"
                placeholder="Paste post ID (UUID)"
                @keyup.enter="fetchDiagnostics()"
                :disabled="loading"
            />
            <button class="btn-primary" :disabled="!postId || loading" @click="fetchDiagnostics()">
                {{ loading ? 'Loading…' : 'Fetch' }}
            </button>
            <button v-if="result" class="btn-secondary" @click="reset">Clear</button>
        </div>

        <div v-if="postId && !result && !error" class="post-id-hint">
            Post ID: <code>{{ postId }}</code>
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>

        <pre v-if="result" class="json-output">{{ formatted }}</pre>
    </div>
</template>

<style scoped>
.input-mode-toggle {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
}

.input-mode-toggle label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.82rem;
    color: #888;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.15s;
}

.input-mode-toggle label.active {
    color: #5b8def;
    border-color: #5b8def;
    background: rgba(91, 141, 239, 0.08);
}

.input-mode-toggle input[type="radio"] {
    width: auto;
    accent-color: #5b8def;
}

.input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.input-row input { flex: 1; }

.post-id-hint {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 8px;
}

.post-id-hint code { color: #5b8def; }

.json-output {
    margin-top: 12px;
    background: #12141c;
    border: 1px solid #2a2d37;
    border-radius: 6px;
    padding: 14px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    color: #c0caf5;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 600px;
    overflow-y: auto;
    line-height: 1.5;
}
</style>
