<script setup>
import { ref, computed } from 'vue';

const bearerToken = defineModel('bearerToken');

const collapsed = ref(false);
const hasToken = computed(() => !!bearerToken.value?.trim());
</script>

<template>
    <div class="card config-card">
        <div class="config-header" @click="collapsed = !collapsed">
            <div class="config-title">
                <h2>⚙️ Configuration</h2>
                <span v-if="hasToken" class="conn-badge conn-ok">● Token set</span>
                <span v-else class="conn-badge conn-err">● No token</span>
            </div>
            <span class="collapse-icon">{{ collapsed ? '▸' : '▾' }}</span>
        </div>

        <div v-show="!collapsed" class="config-body">
            <div>
                <label>Bearer Token</label>
                <input
                    v-model="bearerToken"
                    type="password"
                    placeholder="Paste your bearer token here"
                />
                <div class="token-hint">Get your token from BandLab accounts-test and paste it above.</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.config-card {
    transition: all 0.2s;
}

.config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

.config-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.config-title h2 {
    margin-bottom: 0;
}

.conn-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.conn-ok { color: #4ade80; background: #1a3520; }
.conn-pending { color: #facc15; background: #3a3520; }
.conn-err { color: #f87171; background: #3a1a1a; }

.token-exp {
    font-size: 0.7rem;
    color: #666;
}

.collapse-icon {
    color: #666;
    font-size: 1.1rem;
}

.config-body {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #2a2d37;
}

.config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

label {
    display: block;
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 4px;
}

.token-hint {
    font-size: 0.75rem;
    color: #888;
    margin-top: 6px;
}
</style>
