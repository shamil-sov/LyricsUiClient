<script setup>
import { ref, computed, inject } from 'vue';

const loggedFetch = inject('loggedFetch');

const props = defineProps({
    apiBaseUrl: String,
    authHeaders: Function,
});

const trackUrl = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);
const pollAttempts = ref([]);
const phase = ref(''); // 'triggering' | 'polling' | 'done'

const postId = computed(() => {
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

const elapsed = computed(() => {
    if (pollAttempts.value.length < 2) return '';
    const first = pollAttempts.value[0].time;
    const last = pollAttempts.value[pollAttempts.value.length - 1].time;
    return `${((last - first) / 1000).toFixed(1)}s`;
});

async function trigger() {
    if (!postId.value || !props.apiBaseUrl) return;
    loading.value = true;
    error.value = '';
    result.value = null;
    pollAttempts.value = [];
    phase.value = 'triggering';

    addAttempt('PUT', `/synced-lyrics/${postId.value}`, 'Triggering…');

    try {
        const res = await loggedFetch(
            `${props.apiBaseUrl}/synced-lyrics/${postId.value}`,
            { method: 'PUT', headers: props.authHeaders() }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }

        const data = await res.json();
        updateLastAttempt(res.status, data.status);
        result.value = data;

        if (data.status === 'completed' || data.status === 'failed') {
            phase.value = 'done';
        } else {
            phase.value = 'polling';
            await poll();
        }
    } catch (e) {
        error.value = e.message;
        updateLastAttempt('ERR', e.message);
        phase.value = 'done';
    } finally {
        loading.value = false;
    }
}

async function poll() {
    const maxAttempts = 60;
    const intervalMs = 3000;
    const path = `/synced-lyrics/${postId.value}`;

    for (let i = 0; i < maxAttempts; i++) {
        await sleep(intervalMs);
        addAttempt('GET', path, `Poll #${i + 1}…`);

        try {
            const res = await loggedFetch(
                `${props.apiBaseUrl}/synced-lyrics/${postId.value}`,
                { headers: props.authHeaders() }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`${res.status}: ${text}`);
            }

            const data = await res.json();
            updateLastAttempt(res.status, data.status);
            result.value = data;

            if (data.status === 'completed' || data.status === 'failed') {
                phase.value = 'done';
                return;
            }
        } catch (e) {
            error.value = e.message;
            updateLastAttempt('ERR', e.message);
            phase.value = 'done';
            return;
        }
    }

    phase.value = 'done';
    error.value = 'Timed out after 60 attempts';
}

function addAttempt(method, url, label) {
    pollAttempts.value.push({ method, url, label, status: '…', detail: '', time: Date.now() });
}

function updateLastAttempt(status, detail) {
    const last = pollAttempts.value[pollAttempts.value.length - 1];
    if (last) { last.status = status; last.detail = detail; }
}

function reset() {
    trackUrl.value = '';
    result.value = null;
    pollAttempts.value = [];
    error.value = '';
    phase.value = '';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
</script>

<template>
    <div class="card">
        <h2>🚀 Trigger Transcription</h2>

        <div class="input-row">
            <input
                v-model="trackUrl"
                placeholder="Paste BandLab track URL or post ID"
                @keyup.enter="trigger()"
                :disabled="loading"
            />
            <button class="btn-primary" :disabled="!postId || loading" @click="trigger()">
                {{ loading ? 'Working…' : 'Trigger' }}
            </button>
            <button v-if="result && !loading" class="btn-secondary" @click="reset">Clear</button>
        </div>

        <div v-if="postId && !result" class="post-id-hint">
            Post ID: <code>{{ postId }}</code>
        </div>

        <!-- Poll attempts timeline -->
        <div v-if="pollAttempts.length" class="timeline">
            <div class="timeline-header">
                <span v-if="phase === 'polling'" class="phase-active">⏳ Polling…</span>
                <span v-else-if="phase === 'triggering'" class="phase-active">⏳ Triggering…</span>
                <span v-else-if="phase === 'done' && result?.status === 'completed'" class="phase-done">✅ Done</span>
                <span v-else-if="phase === 'done'" class="phase-fail">❌ {{ result?.status || 'Error' }}</span>
                <span v-if="elapsed" class="elapsed">{{ elapsed }}</span>
            </div>
            <div class="attempts">
                <div
                    v-for="(a, i) in pollAttempts"
                    :key="i"
                    class="attempt"
                    :class="{ 'attempt-err': String(a.status).startsWith('ERR') || Number(a.status) >= 400 }"
                >
                    <span class="attempt-idx">{{ i + 1 }}</span>
                    <span class="attempt-method" :class="'m-' + a.method">{{ a.method }}</span>
                    <span class="attempt-url">{{ a.url }}</span>
                    <span class="attempt-status">{{ a.status }}</span>
                    <span class="attempt-state" :class="'state-' + a.detail">{{ a.detail }}</span>
                </div>
            </div>
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>

        <!-- Results -->
        <div v-if="result && phase === 'done'" class="result-card">
            <div class="result-header">
                <code>{{ result.postId }}</code>
                <div class="result-meta">
                    <span v-if="result.provider" class="provider-badge">{{ result.provider }}</span>
                    <span :class="'status-badge status-' + result.status">{{ result.status }}</span>
                </div>
            </div>

            <div v-if="result.evaluation" class="eval-block">
                <div class="eval-scores">
                    <span>Winner: <strong>{{ result.evaluation.winner }}</strong></span>
                    <span>OpenAI: {{ result.evaluation.openAiScore }}/10</span>
                    <span>GoogleChirp: {{ result.evaluation.googleChirpScore }}/10</span>
                </div>
                <div v-if="result.evaluation.summary" class="eval-summary">{{ result.evaluation.summary }}</div>
            </div>

            <div v-if="result.lyrics?.lines?.length" class="lyrics-lines">
                <div class="lyrics-count">{{ result.lyrics.lines.length }} lines</div>
                <div v-for="(line, i) in result.lyrics.lines" :key="i" class="lyric-line">
                    <span class="line-num">{{ i + 1 }}</span>
                    <span class="line-time">{{ line.startTime }} → {{ line.endTime }}</span>
                    <span class="line-text">{{ line.text }}</span>
                </div>
            </div>

            <div v-if="result.error" class="error-text">
                {{ result.error.code }}: {{ result.error.message }}
            </div>
        </div>
    </div>
</template>

<style scoped>
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

/* Timeline */
.timeline {
    margin: 12px 0;
    background: #12141c;
    border: 1px solid #2a2d37;
    border-radius: 6px;
    padding: 10px 12px;
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.85rem;
}

.phase-active { color: #facc15; }
.phase-done { color: #4ade80; }
.phase-fail { color: #f87171; }
.elapsed { color: #666; font-size: 0.75rem; }

.attempts {
    max-height: 200px;
    overflow-y: auto;
}

.attempt {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    font-size: 0.78rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    border-bottom: 1px solid #1a1d27;
}

.attempt-err { color: #f87171; }

.attempt-idx {
    color: #444;
    min-width: 20px;
    text-align: right;
}

.attempt-method {
    font-weight: 700;
    min-width: 32px;
}

.m-PUT { color: #facc15; }
.m-GET { color: #4ade80; }

.attempt-status {
    min-width: 35px;
    color: #888;
}

.attempt-url {
    color: #555;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.attempt-state {
    min-width: 90px;
    text-align: right;
    font-weight: 600;
}

.state-enqueued { color: #facc15; }
.state-transcribing { color: #60a5fa; }
.state-completed { color: #4ade80; }
.state-failed { color: #f87171; }

/* Result */
.result-card {
    margin-top: 12px;
    background: #12141c;
    border: 1px solid #2a2d37;
    border-radius: 6px;
    padding: 12px;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.result-header code {
    font-size: 0.85rem;
    color: #5b8def;
}

.result-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.provider-badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    background: #1e2a40;
    color: #60a5fa;
}

.eval-block {
    background: #0d0f15;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
}

.eval-scores {
    display: flex;
    gap: 16px;
    font-size: 0.8rem;
    color: #aaa;
    margin-bottom: 6px;
}

.eval-scores strong {
    color: #e0e0e0;
}

.eval-summary {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
    line-height: 1.4;
}

.lyrics-lines {
    max-height: 400px;
    overflow-y: auto;
}

.lyrics-count {
    font-size: 0.72rem;
    color: #666;
    margin-bottom: 6px;
}

.lyric-line {
    display: flex;
    gap: 10px;
    padding: 3px 0;
    border-bottom: 1px solid #1e2030;
    font-size: 0.82rem;
}

.line-num {
    color: #444;
    min-width: 20px;
    text-align: right;
    font-size: 0.72rem;
    font-family: monospace;
}

.line-time {
    color: #555;
    white-space: nowrap;
    font-family: monospace;
    font-size: 0.78rem;
}

.line-text {
    color: #e0e0e0;
}
</style>
