<script setup>
import { ref, inject, onMounted } from 'vue';

const loggedFetch = inject('loggedFetch');

const apiBaseUrl = defineModel('apiBaseUrl');
const bearerToken = defineModel('bearerToken');

const emit = defineEmits(['authenticated']);

const collapsed = ref(true);
const loggingIn = ref(false);
const loginError = ref('');
const tokenExpiry = ref('');
const connected = ref(false);

async function login() {
    loggingIn.value = true;
    loginError.value = '';
    try {
        const res = await loggedFetch('https://accounts-test.bandlab.com/oauth/connect/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: 'bandlab',
                username: 'gordon_l',
                password: 'Bb102938@#',
            }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        bearerToken.value = data.access_token;
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);
        tokenExpiry.value = expiresAt.toLocaleTimeString();
        connected.value = true;
        emit('authenticated');
    } catch (e) {
        loginError.value = e.message;
        connected.value = false;
    } finally {
        loggingIn.value = false;
    }
}

onMounted(() => {
    login();
});
</script>

<template>
    <div class="card config-card">
        <div class="config-header" @click="collapsed = !collapsed">
            <div class="config-title">
                <h2>⚙️ Configuration</h2>
                <span v-if="connected" class="conn-badge conn-ok">● Connected</span>
                <span v-else-if="loggingIn" class="conn-badge conn-pending">● Connecting…</span>
                <span v-else class="conn-badge conn-err">● Disconnected</span>
                <span v-if="tokenExpiry && connected" class="token-exp">expires {{ tokenExpiry }}</span>
            </div>
            <span class="collapse-icon">{{ collapsed ? '▸' : '▾' }}</span>
        </div>

        <div v-show="!collapsed" class="config-body">
            <div class="config-grid">
                <div>
                    <label>API Base URL</label>
                    <input
                        v-model="apiBaseUrl"
                        placeholder="https://..."
                    />
                </div>
                <div>
                    <label>Bearer Token</label>
                    <div class="token-row">
                        <input
                            v-model="bearerToken"
                            type="password"
                            placeholder="Auto-generated or paste manually"
                        />
                        <button class="btn-login" @click="login" :disabled="loggingIn">
                            {{ loggingIn ? '…' : '🔑 Login' }}
                        </button>
                    </div>
                </div>
            </div>
            <div v-if="loginError" class="error">{{ loginError }}</div>
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

.token-row {
    display: flex;
    gap: 8px;
}

.token-row input {
    flex: 1;
}

.btn-login {
    padding: 6px 14px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
}

.btn-login:hover { background: #1d4ed8; }
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

.error {
    font-size: 0.75rem;
    color: #f87171;
    margin-top: 8px;
}
</style>
