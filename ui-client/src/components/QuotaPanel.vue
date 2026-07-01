<script setup>
import { ref, inject, computed } from 'vue';

const loggedFetch = inject('loggedFetch');

const props = defineProps({
    apiBaseUrl: String,
    authHeaders: Function,
    bearerToken: String,
});

const quota = ref(null);
const aiBalance = ref(null);
const aiPrice = ref(null);
const loading = ref(false);
const error = ref('');

const userId = computed(() => {
    if (!props.bearerToken) return null;
    try {
        const payload = JSON.parse(atob(props.bearerToken.split('.')[1]));
        return payload.sub || null;
    } catch {
        return null;
    }
});

async function fetchAll() {
    if (!props.apiBaseUrl) return;
    loading.value = true;
    error.value = '';
    try {
        const requests = [
            loggedFetch(`${props.apiBaseUrl}/synced-lyrics/quota`, { headers: props.authHeaders() }),
            loggedFetch(`${props.apiBaseUrl}/synced-lyrics/ai-tokens/price`, { headers: props.authHeaders() }),
        ];
        if (userId.value) {
            requests.push(
                loggedFetch(`${props.apiBaseUrl}/wallet/users/${userId.value}/balances/ai-tokens`, { headers: props.authHeaders() })
            );
        }
        const results = await Promise.allSettled(requests);

        const quotaRes = results[0];
        if (quotaRes.status === 'fulfilled' && quotaRes.value.ok) {
            quota.value = await quotaRes.value.json();
        }

        const priceRes = results[1];
        if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
            aiPrice.value = await priceRes.value.json();
        }

        if (results[2]) {
            const balRes = results[2];
            if (balRes.status === 'fulfilled' && balRes.value.ok) {
                aiBalance.value = await balRes.value.json();
            }
        }
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}

defineExpose({ refresh: fetchAll });
</script>

<template>
    <div class="card quota-card">
        <div class="quota-header">
            <h2>📊 Quota &amp; AI Tokens</h2>
            <button class="btn-secondary btn-sm" @click="fetchAll" :disabled="loading">
                {{ loading ? '…' : '↻ Refresh' }}
            </button>
        </div>

        <div class="quota-sections">
            <!-- Legacy quota -->
            <div class="quota-section">
                <div class="section-title">Legacy Quota</div>
                <div v-if="quota" class="quota-info">
                    <div class="quota-stat">
                        <span class="quota-label">Remaining</span>
                        <span class="quota-value" :class="{ 'quota-zero': quota.remaining === 0 }">{{ quota.remaining }}</span>
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
                <div v-else-if="!loading" class="quota-empty">Click refresh to load</div>
            </div>

            <!-- AI tokens -->
            <div class="quota-section">
                <div class="section-title">AI Tokens</div>
                <div class="quota-info">
                    <div class="quota-stat">
                        <span class="quota-label">Available</span>
                        <span class="quota-value ai-value">{{ aiBalance !== null ? aiBalance.available : '—' }}</span>
                    </div>
                    <div class="quota-divider" />
                    <div class="quota-stat">
                        <span class="quota-label">Held</span>
                        <span class="quota-value ai-value">{{ aiBalance !== null ? aiBalance.held : '—' }}</span>
                    </div>
                    <div class="quota-divider" />
                    <div class="quota-stat">
                        <span class="quota-label">Total</span>
                        <span class="quota-value ai-value">{{ aiBalance !== null ? aiBalance.total : '—' }}</span>
                    </div>
                    <div class="quota-divider" />
                    <div class="quota-stat">
                        <span class="quota-label">Price / transcription</span>
                        <span class="quota-value ai-value">{{ aiPrice !== null ? aiPrice.amount : '—' }}</span>
                    </div>
                </div>
                <div v-if="!userId" class="quota-empty">Paste token to load balance</div>
            </div>
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

.quota-sections {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
}

.quota-section {
    flex: 1;
    min-width: 200px;
}

.section-title {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    margin-bottom: 10px;
}

.ai-value {
    color: #c084fc;
}
</style>
