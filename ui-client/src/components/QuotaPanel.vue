<script setup>
import { ref, inject, onMounted } from 'vue';

const loggedFetch = inject('loggedFetch');

const props = defineProps({
    apiBaseUrl: String,
    authHeaders: Function,
});

const quota = ref(null);
const loading = ref(false);
const error = ref('');

async function fetchQuota() {
    if (!props.apiBaseUrl) return;
    loading.value = true;
    error.value = '';
    try {
        const res = await loggedFetch(
            `${props.apiBaseUrl}/synced-lyrics/quota`,
            { headers: props.authHeaders() }
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
        }
        quota.value = await res.json();
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}

defineExpose({ refresh: fetchQuota });
</script>

<template>
    <div class="card quota-card">
        <div class="quota-header">
            <h2>📊 Quota</h2>
            <button class="btn-secondary btn-sm" @click="fetchQuota" :disabled="loading">
                {{ loading ? '…' : '↻ Refresh' }}
            </button>
        </div>

        <div v-if="quota" class="quota-info">
            <div class="quota-stat">
                <span class="quota-label">Remaining</span>
                <span class="quota-value" :class="{ 'quota-zero': quota.remaining === 0 }">
                    {{ quota.remaining }}
                </span>
            </div>
            <div class="quota-divider" />
            <div class="quota-stat">
                <span class="quota-label">Limit</span>
                <span class="quota-value">{{ quota.limit }}</span>
            </div>
            <div class="quota-divider" />
            <div class="quota-stat">
                <span class="quota-label">Used</span>
                <span class="quota-value">{{ quota.limit - quota.remaining }}</span>
            </div>
        </div>

        <div v-else-if="!loading && !error" class="quota-empty">
            Click refresh to load quota
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>
    </div>
</template>

<style scoped>
.quota-card {
    transition: all 0.2s;
}

.quota-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.quota-header h2 {
    margin-bottom: 0;
}

.btn-sm {
    padding: 4px 12px;
    font-size: 0.78rem;
}

.quota-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.quota-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
}

.quota-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
    margin-bottom: 4px;
}

.quota-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #4ade80;
}

.quota-zero {
    color: #f87171;
}

.quota-divider {
    width: 1px;
    height: 36px;
    background: #2a2d37;
}

.quota-empty {
    font-size: 0.85rem;
    color: #555;
}
</style>
