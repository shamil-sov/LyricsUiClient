<script setup>
import { ref, inject } from 'vue';

const loggedFetch = inject('loggedFetch');

const props = defineProps({
    items: Array,
    loading: Boolean,
    error: String,
    apiBaseUrl: String,
    authHeaders: Function,
});

const emit = defineEmits(['refresh', 'regenerated']);

const regeneratingId = ref(null);
const regenerateError = ref('');
const deletingId = ref(null);
const deleteError = ref('');

async function regenerate(postId) {
    regeneratingId.value = postId;
    regenerateError.value = '';
    try {
        const res = await loggedFetch(
            `${props.apiBaseUrl}/synced-lyrics/${postId}`,
            {
                method: 'PUT',
                headers: props.authHeaders(),
                body: JSON.stringify({ regenerate: true }),
            }
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }
        emit('regenerated');
    } catch (e) {
        regenerateError.value = `${postId}: ${e.message}`;
    } finally {
        regeneratingId.value = null;
    }
}

async function deleteLyrics(postId) {
    if (!confirm(`Delete lyrics for ${postId}?`)) return;
    deletingId.value = postId;
    deleteError.value = '';
    try {
        const res = await loggedFetch(
            `${props.apiBaseUrl}/synced-lyrics/${postId}`,
            {
                method: 'DELETE',
                headers: props.authHeaders(),
            }
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }
        emit('refresh');
    } catch (e) {
        deleteError.value = `${postId}: ${e.message}`;
    } finally {
        deletingId.value = null;
    }
}

const expandedId = ref(null);

function toggle(postId) {
    expandedId.value = expandedId.value === postId ? null : postId;
}
</script>

<template>
    <div class="card">
        <div class="list-header">
            <h2>📋 All Lyrics ({{ items.length }})</h2>
            <button class="btn-secondary" :disabled="loading" @click="$emit('refresh')">
                {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>
        <div v-if="regenerateError" class="error-text">{{ regenerateError }}</div>
        <div v-if="deleteError" class="error-text">{{ deleteError }}</div>

        <div v-if="!loading && items.length === 0" class="empty">No lyrics found.</div>

        <div v-for="item in items" :key="item.postId" class="lyrics-item" @click="toggle(item.postId)">
            <div class="item-header">
                <div class="item-left">
                    <code class="item-post-id">{{ item.postId }}</code>
                    <span v-if="item.provider" class="provider-badge">{{ item.provider }}</span>
                    <span v-if="item.lineCount" class="meta-dim">{{ item.lineCount }} lines</span>
                    <span v-if="item.evaluation?.winner" class="meta-dim">
                        winner: <strong>{{ item.evaluation.winner }}</strong>
                        (OAI {{ item.evaluation.openAiScore }} / GC {{ item.evaluation.googleChirpScore }})
                    </span>
                </div>
                <div class="item-actions">
                    <span :class="'status-badge status-' + item.status">{{ item.status }}</span>
                    <button
                        v-if="item.status === 'completed' || item.status === 'failed'"
                        class="btn-danger btn-sm"
                        :disabled="regeneratingId === item.postId"
                        @click.stop="regenerate(item.postId)"
                    >
                        {{ regeneratingId === item.postId ? '...' : '↻ Redo' }}
                    </button>
                    <button
                        class="btn-delete btn-sm"
                        :disabled="deletingId === item.postId"
                        @click.stop="deleteLyrics(item.postId)"
                    >
                        {{ deletingId === item.postId ? '...' : '✕' }}
                    </button>
                </div>
            </div>

            <div v-if="expandedId === item.postId" class="item-detail">
                <div v-if="item.evaluation?.summary" class="eval-summary">
                    {{ item.evaluation.summary }}
                </div>

                <div v-if="item.lyrics?.lines?.length" class="lyrics-lines">
                    <div v-for="(line, i) in item.lyrics.lines" :key="i" class="lyric-line">
                        <span class="line-time">{{ line.startTime }} → {{ line.endTime }}</span>
                        <span class="line-text">{{ line.text }}</span>
                    </div>
                </div>

                <div v-if="item.error" class="error-detail">
                    <strong>{{ item.error.code }}</strong>: {{ item.error.message }}
                </div>

                <div v-if="!item.lyrics?.lines?.length && !item.error" class="empty">
                    No lyrics data yet.
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.empty {
    color: #666;
    font-size: 0.85rem;
    padding: 12px 0;
}

.lyrics-item {
    background: #12141c;
    border: 1px solid #2a2d37;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.15s;
}

.lyrics-item:hover {
    border-color: #444;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.item-post-id {
    font-size: 0.82rem;
    color: #5b8def;
    flex-shrink: 0;
}

.provider-badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    background: #1e2a40;
    color: #60a5fa;
    flex-shrink: 0;
}

.meta-dim {
    font-size: 0.72rem;
    color: #666;
    white-space: nowrap;
}

.meta-dim strong {
    color: #aaa;
}

.item-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.btn-sm {
    padding: 3px 8px;
    font-size: 0.72rem;
}

.btn-delete {
    background: transparent;
    color: #666;
    border: 1px solid #333;
    padding: 2px 6px;
    font-size: 0.72rem;
}

.btn-delete:hover:not(:disabled) {
    color: #ef5b5b;
    border-color: #ef5b5b44;
    background: #3a1a1a;
}

.item-detail {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #2a2d37;
}

.eval-summary {
    font-size: 0.8rem;
    color: #aaa;
    background: #0d0f15;
    padding: 8px 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    line-height: 1.4;
    font-style: italic;
}

.lyrics-lines {
    max-height: 250px;
    overflow-y: auto;
}

.lyric-line {
    display: flex;
    gap: 12px;
    padding: 3px 0;
    border-bottom: 1px solid #1e2030;
    font-size: 0.82rem;
}

.line-time {
    color: #666;
    white-space: nowrap;
    font-family: monospace;
    font-size: 0.78rem;
}

.line-text {
    color: #e0e0e0;
}

.error-detail {
    color: #ef5b5b;
    font-size: 0.85rem;
}
</style>
