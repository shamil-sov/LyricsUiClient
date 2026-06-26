<script setup>
import { ref, computed } from 'vue';

const bearerToken = defineModel('bearerToken');
const env = defineModel('env');

const collapsed = ref(false);
const hasToken = computed(() => !!bearerToken.value?.trim());
</script>

<template>
    <div class="card config-card">
        <div class="config-header" @click="collapsed = !collapsed">
            <div class="config-title">
                <h2>⚙️ Configuration</h2>
                <span class="env-badge" :class="env === 'prod' ? 'env-prod' : 'env-test'">
                    {{ env === 'prod' ? 'PROD' : 'TEST' }}
                </span>
                <span v-if="hasToken" class="conn-badge conn-ok">● Token set</span>
                <span v-else class="conn-badge conn-err">● No token</span>
            </div>
            <span class="collapse-icon">{{ collapsed ? '▸' : '▾' }}</span>
        </div>

        <div v-show="!collapsed" class="config-body">
            <div class="config-grid">
                <div>
                    <label>Environment</label>
                    <div class="env-toggle">
                        <button :class="['env-btn', { active: env === 'test' }]" @click="env = 'test'">Test</button>
                        <button :class="['env-btn', { active: env === 'prod' }]" @click="env = 'prod'">Prod</button>
                    </div>
                </div>
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

.config-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: start;
}

.env-toggle {
    display: flex;
    gap: 4px;
}

.env-btn {
    padding: 6px 16px;
    border-radius: 6px;
    border: 1px solid #444;
    background: #12141c;
    color: #888;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
}

.env-btn.active.env-prod-active {
    background: #3a1a20;
    border-color: #e05555;
    color: #f87171;
}

.env-btn:first-child.active {
    background: #1a2a3a;
    border-color: #5b8def;
    color: #93c5fd;
}

.env-btn:last-child.active {
    background: #3a1a20;
    border-color: #e05555;
    color: #f87171;
}

.env-badge {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.05em;
}

.env-test {
    background: #1a2a3a;
    color: #93c5fd;
}

.env-prod {
    background: #3a1a20;
    color: #f87171;
}

.token-hint {
    font-size: 0.75rem;
    color: #888;
    margin-top: 6px;
}
</style>
