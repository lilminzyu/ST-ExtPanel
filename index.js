// Extension Panel Manager
// 管理擴充功能面板的顯示/隱藏與左右欄位置

import { eventSource, event_types } from '../../../../script.js';

const STORAGE_KEY = 'ext_panel_manager_state';

function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 取得兩欄的所有 extension_container，依 DOM 順序
function getAllContainers() {
    return [
        ...document.querySelectorAll('#extensions_settings > .extension_container'),
        ...document.querySelectorAll('#extensions_settings2 > .extension_container'),
    ];
}

// 取得容器名稱（優先找最外層 inline-drawer-header 的 b）
function getContainerName(container) {
    // 只找第一層 inline-drawer 的 header（不深入子 inline-drawer）
    const firstDrawer = container.querySelector(':scope > * > .inline-drawer > .inline-drawer-header b, :scope > .inline-drawer > .inline-drawer-header b');
    if (firstDrawer) return firstDrawer.textContent.trim();
    // fallback
    const anyB = container.querySelector('b');
    return anyB?.textContent.trim() || container.id || '(unnamed)';
}

// ===== 套用儲存狀態（頁面載入時）=====
function applyStoredState() {
    const stored = loadState();

    if (stored.hidden?.length) {
        stored.hidden.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('ext-panel-hidden');
                el.style.display = 'none';
            }
        });
    }

    if (stored.order?.length) {
        const col1 = document.getElementById('extensions_settings');
        const col2 = document.getElementById('extensions_settings2');
        if (!col1 || !col2) return;

        // 按照儲存的順序，依序 append（還原欄位 + 相對順序）
        stored.order.forEach(({ id, col }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const target = col === 2 ? col2 : col1;
            target.appendChild(el);
        });
    }
}

// ===== 編輯模式 =====
let isEditing = false;
let snapshot = null;

function takeSnapshot() {
    const col2 = document.getElementById('extensions_settings2');
    const hidden = new Set();
    // 記錄每個容器的 {col, index} 以保留順序
    const order = [];

    getAllContainers().forEach(el => {
        if (!el.id) return;
        if (el.classList.contains('ext-panel-hidden')) hidden.add(el.id);
        const col = el.parentElement === col2 ? 2 : 1;
        order.push({ id: el.id, col });
    });

    return { hidden, order };
}

function enterEditMode() {
    if (isEditing) return;
    isEditing = true;

    snapshot = takeSnapshot();

    const col1 = document.getElementById('extensions_settings');
    const col2 = document.getElementById('extensions_settings2');
    if (!col1 || !col2) return;

    // 為每個容器插入 edit-bar（包含勾選框和移動按鈕）
    getAllContainers().forEach(container => {
        if (!container.id) return;
        if (container.querySelector('.ext-panel-edit-bar')) return;

        const isVisible = !container.classList.contains('ext-panel-hidden');

        // 讓隱藏的容器在編輯模式下可見（半透明）
        container.style.display = '';
        if (!isVisible) container.style.opacity = '0.4';

        const name = getContainerName(container);

        const bar = document.createElement('div');
        bar.className = 'ext-panel-edit-bar';

        // 勾選框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'ext-panel-checkbox';
        checkbox.checked = isVisible;
        checkbox.title = '顯示此面板';
        checkbox.onclick = e => e.stopPropagation();
        checkbox.onchange = e => {
            e.stopPropagation();
            if (checkbox.checked) {
                container.classList.remove('ext-panel-hidden');
                container.style.opacity = '';
            } else {
                container.classList.add('ext-panel-hidden');
                container.style.opacity = '0.4';
            }
            updateFloatingCount();
        };

        // 名稱
        const label = document.createElement('span');
        label.className = 'ext-panel-name';
        label.textContent = name;

        // 左移
        const moveLeft = document.createElement('button');
        moveLeft.className = 'ext-panel-move-btn';
        moveLeft.textContent = '◀';
        moveLeft.title = '移到左欄';
        moveLeft.onclick = e => { e.stopPropagation(); col1.appendChild(container); };

        // 右移
        const moveRight = document.createElement('button');
        moveRight.className = 'ext-panel-move-btn';
        moveRight.textContent = '▶';
        moveRight.title = '移到右欄';
        moveRight.onclick = e => { e.stopPropagation(); col2.appendChild(container); };

        bar.append(checkbox, label, moveLeft, moveRight);
        container.prepend(bar);
    });

    // 浮動面板
    const wrapper = document.createElement('div');
    wrapper.id = 'ext-panel-float-wrapper';
    wrapper.innerHTML = `
        <div id="ext-panel-float-panel">
            <span id="ext-panel-float-count"></span>
            <div id="ext-panel-float-finish" class="menu_button menu_button_icon" title="確認">
                <i class="fa-solid fa-check"></i>
            </div>
            <div id="ext-panel-float-cancel" class="menu_button menu_button_icon" title="取消">
                <i class="fa-solid fa-xmark"></i>
            </div>
        </div>
    `;

    // 插在整個擴充功能 block 的最後
    const extBlock = document.querySelector('#rm_extensions_block');
    (extBlock || document.body).appendChild(wrapper);

    wrapper.querySelector('#ext-panel-float-finish').onclick = confirmEditMode;
    wrapper.querySelector('#ext-panel-float-cancel').onclick = cancelEditMode;

    updateFloatingCount();
    updateManageBtn(true);
}

function updateFloatingCount() {
    const el = document.getElementById('ext-panel-float-count');
    if (!el) return;
    const all = getAllContainers();
    const visible = all.filter(c => !c.classList.contains('ext-panel-hidden')).length;
    el.textContent = `顯示 ${visible} / ${all.length}`;
}

function confirmEditMode() {
    if (!isEditing) return;
    isEditing = false;

    const col2 = document.getElementById('extensions_settings2');
    const newState = { hidden: [], order: [] };

    getAllContainers().forEach(container => {
        if (!container.id) return;
        const isHidden = container.classList.contains('ext-panel-hidden');
        if (isHidden) {
            container.style.display = 'none';
            newState.hidden.push(container.id);
        } else {
            container.style.display = '';
        }
        container.style.opacity = '';
        const col = container.parentElement === col2 ? 2 : 1;
        newState.order.push({ id: container.id, col });
    });

    saveState(newState);
    snapshot = null;

    cleanupEditUI();
    updateManageBtn(false);
    toastr?.success('面板設定已儲存');
}

function cancelEditMode() {
    if (!isEditing) return;
    isEditing = false;

    cleanupEditUI();

    if (snapshot) {
        const col1 = document.getElementById('extensions_settings');
        const col2 = document.getElementById('extensions_settings2');

        // 還原欄位和順序（按 snapshot.order 依序 appendChild）
        snapshot.order.forEach(({ id, col }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const target = col === 2 ? col2 : col1;
            target.appendChild(el);
        });

        // 還原顯示/隱藏
        getAllContainers().forEach(container => {
            if (!container.id) return;
            container.style.opacity = '';
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
    document.querySelectorAll('.ext-panel-edit-bar').forEach(el => el.remove());
    document.getElementById('ext-panel-float-wrapper')?.remove();
}

function updateManageBtn(active) {
    document.getElementById('ext-panel-manage-btn')?.classList.toggle('active', active);
}

// ===== 建立管理按鈕 =====
function createManageButton() {
    if (document.getElementById('ext-panel-manage-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'ext-panel-manage-btn';
    btn.className = 'menu_button menu_button_icon interactable';
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.title = '管理擴充功能面板';
    btn.innerHTML = '<i class="fa-solid fa-table-columns"></i><span>管理面板</span>';
    btn.onclick = () => isEditing ? cancelEditMode() : enterEditMode();

    const installBtn = document.getElementById('third_party_extension_button');
    installBtn?.insertAdjacentElement('afterend', btn);
}

// ===== 初始化 =====
function initialize() {
    createManageButton();
    applyStoredState();
}

if (document.getElementById('extensions_settings') && document.getElementById('third_party_extension_button')) {
    initialize();
} else {
    const observer = new MutationObserver(() => {
        if (document.getElementById('extensions_settings') && document.getElementById('third_party_extension_button')) {
            observer.disconnect();
            initialize();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
