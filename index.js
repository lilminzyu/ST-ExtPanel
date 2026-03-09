// Extension Panel Manager
// 管理擴充功能面板的顯示/隱藏與左右欄位置

import { eventSource, event_types } from '../../../../script.js';

const STORAGE_KEY = 'ext_panel_manager_state';

// 讀取儲存的狀態
function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

// 儲存狀態
function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 套用儲存狀態到 DOM（頁面載入時）
function applyStoredState() {
    const state = loadState();

    // 套用隱藏
    if (state.hidden) {
        state.hidden.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('ext-panel-hidden');
                el.style.display = 'none';
            }
        });
    }

    // 套用欄位移動
    if (state.moved) {
        const col1 = document.getElementById('extensions_settings');
        const col2 = document.getElementById('extensions_settings2');
        if (!col1 || !col2) return;

        state.moved.forEach(({ id, col }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const target = col === 2 ? col2 : col1;
            if (el.parentElement !== target) {
                target.appendChild(el);
            }
        });
    }
}

// 取得所有 extension_container（跨兩欄）
function getAllContainers() {
    return [
        ...document.querySelectorAll('#extensions_settings > .extension_container'),
        ...document.querySelectorAll('#extensions_settings2 > .extension_container'),
    ];
}

// 取得容器的顯示名稱
function getContainerName(container) {
    const b = container.querySelector('.inline-drawer-toggle b, .inline-drawer-header b');
    return b?.textContent?.trim() || container.id || '(unnamed)';
}

// ===== 編輯模式狀態 =====
let isEditing = false;
let snapshot = null; // 進入編輯模式前的快照

// 快照結構: { hidden: Set<id>, positions: Map<id, {col, nextSibling}> }
function takeSnapshot() {
    const col1 = document.getElementById('extensions_settings');
    const col2 = document.getElementById('extensions_settings2');
    const hidden = new Set();
    const positions = new Map();

    getAllContainers().forEach(el => {
        if (!el.id) return;
        if (el.classList.contains('ext-panel-hidden')) hidden.add(el.id);
        const col = el.parentElement === col2 ? 2 : 1;
        positions.set(el.id, { col, nextSibling: el.nextElementSibling?.id || null });
    });

    return { hidden, positions };
}

// 進入編輯模式
function enterEditMode() {
    if (isEditing) return;
    isEditing = true;

    snapshot = takeSnapshot();

    const col1 = document.getElementById('extensions_settings');
    const col2 = document.getElementById('extensions_settings2');
    if (!col1 || !col2) return;

    // 讓整個區域進入編輯模式 class（顯示隱藏的）
    col1.classList.add('ext-panel-edit-mode');
    col2.classList.add('ext-panel-edit-mode');

    // 為每個容器加上勾選框和移動按鈕
    getAllContainers().forEach(container => {
        if (!container.id) return;
        const header = container.querySelector('.inline-drawer-toggle, .inline-drawer-header');
        if (!header) return;
        if (header.querySelector('.ext-panel-checkbox')) return; // 避免重複

        // 勾選框（顯示/隱藏）
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'ext-panel-checkbox';
        checkbox.checked = !container.classList.contains('ext-panel-hidden');
        checkbox.title = '顯示此擴充功能面板';
        checkbox.onclick = (e) => e.stopPropagation();
        checkbox.onchange = (e) => {
            e.stopPropagation();
            const show = checkbox.checked;
            if (show) {
                container.classList.remove('ext-panel-hidden');
                container.style.display = '';
            } else {
                container.classList.add('ext-panel-hidden');
                // 編輯模式下仍顯示（透明），靠 CSS 處理
                container.style.display = '';
            }
            updateFloatingCount();
        };

        // 左移按鈕（移到 col1）
        const moveLeftBtn = document.createElement('button');
        moveLeftBtn.className = 'ext-panel-move-btn';
        moveLeftBtn.textContent = '◀';
        moveLeftBtn.title = '移到左欄';
        moveLeftBtn.onclick = (e) => {
            e.stopPropagation();
            col1.appendChild(container);
        };

        // 右移按鈕（移到 col2）
        const moveRightBtn = document.createElement('button');
        moveRightBtn.className = 'ext-panel-move-btn';
        moveRightBtn.textContent = '▶';
        moveRightBtn.title = '移到右欄';
        moveRightBtn.onclick = (e) => {
            e.stopPropagation();
            col2.appendChild(container);
        };

        header.insertBefore(checkbox, header.firstChild);
        header.appendChild(moveLeftBtn);
        header.appendChild(moveRightBtn);
    });

    // 建立浮動確認面板
    const wrapper = document.createElement('div');
    wrapper.id = 'ext-panel-float-wrapper';

    const panel = document.createElement('div');
    panel.id = 'ext-panel-float-panel';
    panel.innerHTML = `
        <span id="ext-panel-float-count"></span>
        <div id="ext-panel-float-finish" class="menu_button menu_button_icon" title="確認">
            <i class="fa-solid fa-check"></i>
        </div>
        <div id="ext-panel-float-cancel" class="menu_button menu_button_icon" title="取消">
            <i class="fa-solid fa-xmark"></i>
        </div>
    `;

    wrapper.appendChild(panel);

    // 掛在 extensions_settings 下方的 container 後面
    const extBlock = document.querySelector('.extensions_block');
    if (extBlock) {
        extBlock.appendChild(wrapper);
    } else {
        document.body.appendChild(wrapper);
    }

    panel.querySelector('#ext-panel-float-finish').onclick = confirmEditMode;
    panel.querySelector('#ext-panel-float-cancel').onclick = cancelEditMode;

    updateFloatingCount();
    updateManageBtn(true);
}

function updateFloatingCount() {
    const el = document.getElementById('ext-panel-float-count');
    if (!el) return;
    const total = getAllContainers().length;
    const visible = getAllContainers().filter(c => !c.classList.contains('ext-panel-hidden')).length;
    el.textContent = `顯示 ${visible} / ${total}`;
}

// 確認編輯
function confirmEditMode() {
    if (!isEditing) return;
    isEditing = false;

    // 移除編輯 UI
    cleanupEditUI();

    // 真正套用：隱藏的就 display:none
    const col1 = document.getElementById('extensions_settings');
    const col2 = document.getElementById('extensions_settings2');

    const newState = { hidden: [], moved: [] };

    getAllContainers().forEach(container => {
        if (!container.id) return;
        if (container.classList.contains('ext-panel-hidden')) {
            container.style.display = 'none';
            newState.hidden.push(container.id);
        } else {
            container.style.display = '';
        }
        const col = container.parentElement === col2 ? 2 : 1;
        newState.moved.push({ id: container.id, col });
    });

    saveState(newState);
    snapshot = null;
    updateManageBtn(false);
    toastr?.success('面板設定已儲存');
}

// 取消編輯
function cancelEditMode() {
    if (!isEditing) return;
    isEditing = false;

    // 移除編輯 UI
    cleanupEditUI();

    // 還原快照
    if (snapshot) {
        const col1 = document.getElementById('extensions_settings');
        const col2 = document.getElementById('extensions_settings2');

        // 還原位置
        // 先按照 snapshot 的順序重新排列
        const posArray = [...snapshot.positions.entries()];
        // 分組
        const col1Items = posArray.filter(([, v]) => v.col === 1);
        const col2Items = posArray.filter(([, v]) => v.col === 2);

        col1Items.forEach(([id]) => {
            const el = document.getElementById(id);
            if (el && col1) col1.appendChild(el);
        });
        col2Items.forEach(([id]) => {
            const el = document.getElementById(id);
            if (el && col2) col2.appendChild(el);
        });

        // 還原顯示/隱藏
        getAllContainers().forEach(container => {
            if (!container.id) return;
            if (snapshot.hidden.has(container.id)) {
                container.classList.add('ext-panel-hidden');
                container.style.display = 'none';
            } else {
                container.classList.remove('ext-panel-hidden');
                container.style.display = '';
            }
        });

        snapshot = null;
    }

    updateManageBtn(false);
    toastr?.info('已取消，還原至修改前');
}

function cleanupEditUI() {
    // 移除勾選框和移動按鈕
    document.querySelectorAll('.ext-panel-checkbox').forEach(el => el.remove());
    document.querySelectorAll('.ext-panel-move-btn').forEach(el => el.remove());

    // 移除浮動面板
    document.getElementById('ext-panel-float-wrapper')?.remove();

    // 移除 edit-mode class
    document.getElementById('extensions_settings')?.classList.remove('ext-panel-edit-mode');
    document.getElementById('extensions_settings2')?.classList.remove('ext-panel-edit-mode');
}

function updateManageBtn(active) {
    const btn = document.getElementById('ext-panel-manage-btn');
    if (!btn) return;
    btn.classList.toggle('active', active);
}

// 建立管理按鈕
function createManageButton() {
    if (document.getElementById('ext-panel-manage-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'ext-panel-manage-btn';
    btn.className = 'menu_button menu_button_icon interactable';
    btn.tabIndex = 0;
    btn.role = 'button';
    btn.title = '管理擴充功能面板';
    btn.innerHTML = '<i class="fa-solid fa-table-columns"></i><span>管理面板</span>';

    btn.onclick = () => {
        if (isEditing) {
            cancelEditMode();
        } else {
            enterEditMode();
        }
    };

    // 插在安裝擴充功能按鈕的後面
    const installBtn = document.getElementById('third_party_extension_button');
    if (installBtn) {
        installBtn.insertAdjacentElement('afterend', btn);
    }
}

// 等待 DOM 就緒後初始化
function initialize() {
    createManageButton();
    applyStoredState();
}

// 監視 DOM，等 extensions_settings 出現
const observer = new MutationObserver(() => {
    if (document.getElementById('extensions_settings') && document.getElementById('third_party_extension_button')) {
        observer.disconnect();
        initialize();
    }
});

if (document.getElementById('extensions_settings')) {
    initialize();
} else {
    observer.observe(document.body, { childList: true, subtree: true });
}
