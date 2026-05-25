<script setup>
import { ref } from 'vue';

const props = defineProps({
    logs: Array,
});

defineEmits(['clear']);

const collapsed = ref(true);
const expandedLog = ref(null);

function toggle(id) {
    expandedLog.value = expandedLog.value === id ? null : id;
}

function methodColor(method) {
    const colors = { GET: '#4ade80', PUT: '#facc15', POST: '#60a5fa', DELETE: '#f87171' };
    return colors[method] || '#e0e0e0';
}

function statusColor(status) {
    if (status >= 200 && status < 300) return '#4ade80';
    if (status >= 400 && status < 500) return '#facc15';
    return '#f87171';
}

function tryPrettyJson(str) {
    if (!str) return str;
    try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}
</script>

<template>
    <div class="card log-panel">
        <div class="log-header" @click="collapsed = !collapsed">
            <div class="log-title">
                <h2>📡 HTTP Log</h2>
                <span class="log-count">{{ logs.length }}</span>
            </div>
            <div class="log-actions">
                <button v-if="!collapsed" class="btn-secondary btn-sm" @click.stop="$emit('clear')">Clear</button>
                <span class="collapse-icon">{{ collapsed ? '▸' : '▾' }}</span>
            </div>
        </div>

        <div v-show="!collapsed" class="log-body">

        <div v-if="logs.length === 0" class="empty">No requests yet</div>

        <div v-for="log in logs" :key="log.id" class="log-entry" @click="toggle(log.id)">
            <div class="log-summary">
                <span class="log-time">{{ log.ts }}</span>
                <span class="log-method" :style="{ color: methodColor(log.method) }">{{ log.method }}</span>
                <span class="log-url">{{ log.url }}</span>
                <span class="log-status" :style="{ color: statusColor(log.status) }">
                    {{ log.status }} {{ log.statusText }}
                </span>
            </div>

            <div v-if="expandedLog === log.id" class="log-details">
                <div v-if="log.requestBody" class="log-section">
                    <strong>Request Body:</strong>
                    <pre>{{ tryPrettyJson(log.requestBody) }}</pre>
                </div>
                <div class="log-section">
                    <strong>Request Headers:</strong>
                    <pre>{{ JSON.stringify(log.requestHeaders, null, 2) }}</pre>
                </div>
                <div class="log-section">
                    <strong>Response Body:</strong>
                    <pre>{{ tryPrettyJson(log.responseBody) }}</pre>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>

<style scoped>
.log-panel {
    overflow: hidden;
}

.log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

.log-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.log-title h2 {
    margin-bottom: 0;
}

.log-count {
    font-size: 0.7rem;
    font-weight: 700;
    background: #2a2d37;
    color: #888;
    padding: 1px 7px;
    border-radius: 10px;
}

.log-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-sm {
    padding: 3px 10px;
    font-size: 0.72rem;
}

.collapse-icon {
    color: #666;
    font-size: 1.1rem;
}

.log-body {
    margin-top: 12px;
    max-height: 400px;
    overflow-y: auto;
}

.empty {
    color: #666;
    font-size: 0.85rem;
    text-align: center;
    padding: 16px;
}

.log-entry {
    border-bottom: 1px solid #2a2d37;
    padding: 8px 0;
    cursor: pointer;
}

.log-entry:hover {
    background: rgba(255, 255, 255, 0.03);
}

.log-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.82rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
}

.log-time {
    color: #666;
    min-width: 75px;
}

.log-method {
    font-weight: 700;
    min-width: 55px;
}

.log-url {
    color: #aaa;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.log-status {
    font-weight: 600;
    min-width: 80px;
    text-align: right;
}

.log-details {
    margin-top: 8px;
    padding: 8px 12px;
    background: #12141c;
    border-radius: 6px;
}

.log-section {
    margin-bottom: 10px;
}

.log-section strong {
    display: block;
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 4px;
}

.log-section pre {
    font-size: 0.78rem;
    color: #ccc;
    background: #0d0f15;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow-y: auto;
}
</style>
