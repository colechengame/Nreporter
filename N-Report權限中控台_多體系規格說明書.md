# N-Report 權限中控台 - 多體系(集團)架構前端規格說明書

## 1. 概述 (Overview)
本文件說明 N-Report 權限中控台新增的「多體系/集團切換」功能規格。此功能允許使用者在同一介面中，透過頂部導航列的切換器，在「星辰集團」、「中醫體系」或「全部體系」之間切換視角。

切換體系後，系統將自動過濾：
1. **門市列表**：只顯示該體系下的門市。
2. **統計數據**：頂部 Dashboard 數據僅計算該體系。
3. **人員選單**：在執行「權限移轉」、「新增人員」或「新展店指派」時，下拉選單僅顯示該體系所屬的員工。

---

## 2. 資料結構 (Data Structures)

### 2.1 體系定義 (System Configuration)
前端需維護一份體系設定檔（常量）。

```javascript
const BUSINESS_SYSTEMS = {
    all: { 
        name: '全部體系', 
        icon: 'fa-globe', 
        color: 'text-white', 
        bgColor: 'bg-slate-600' 
    },
    guangze: { 
        name: '星辰集團', 
        icon: 'fa-star', 
        color: 'text-yellow-300', 
        bgColor: 'bg-indigo-600' 
    },
    tcm: { 
        name: '中醫體系', 
        icon: 'fa-leaf', 
        color: 'text-green-300', 
        bgColor: 'bg-green-600' 
    }
};
```

### 2.2 全域狀態 (Global State)
需追蹤當前選定的體系。

```javascript
// 預設為 'all' (最高權限視角)
let currentBusinessSystem = 'all'; 
```

### 2.3 門市資料擴充 (Store Model)
門市物件需新增 `businessSystem` 欄位，或透過 `code`/`name` 進行邏輯判斷。

```javascript
{ 
    code: 'NJ_TCM', 
    name: '南京京都堂', 
    // ... 其他欄位
    businessSystem: 'tcm' // 新增欄位：識別所屬體系
}
```

### 2.4 人員資料擴充 (Staff Model)
人員物件需新增 `businessSystem` 欄位，用於下拉選單過濾。

```javascript
{ 
    id: 'T001', 
    name: '張醫師', 
    role: '院長', 
    businessSystem: 'tcm' // 新增欄位：識別所屬體系 (guangze 或 tcm)
}
```

---

## 3. 功能邏輯 (Functional Logic)

### 3.1 頂部導航列切換
*   **位置**：Logo 右側。
*   **行為**：
    *   點擊顯示下拉選單。
    *   選擇後更新 `currentBusinessSystem` 變數。
    *   觸發全頁重新渲染 (`renderStores`, `updateHeaderStats` 等)。
    *   **視覺回饋**：按鈕 Icon 與文字需隨選擇變更（例如選中醫顯示葉子圖示）。

### 3.2 門市列表過濾 (Store Filtering)
在 `renderStores()` 或是 `getFilteredStores()` 中實作過濾邏輯：

*   **邏輯**：
    *   若 `currentBusinessSystem === 'all'`，顯示所有門市。
    *   若為特定體系，僅顯示 `store.businessSystem === currentBusinessSystem` 的門市。
*   **視覺標示**：
    *   醫美/養生門市維持原有圖示。
    *   中醫門市顯示 `fa-leaf` (綠色) 圖示。

### 3.3 統計數據更新 (Dashboard Stats)
頂部的數據計數器（醫美 N 家、報表 N 份...）需根據過濾後的門市列表重新計算。

*   **中醫體系視角**：顯示「中醫」家數。
*   **星辰集團視角**：顯示「醫美」、「岩盤浴」家數。
*   **全部視角**：顯示所有分類總和。

### 3.4 **關鍵：人員下拉選單連動 (Cascading Staff Select)**
當使用者開啟 Modal 進行人員操作時，`populateStaffSelect()` 必須根據當前視角過濾名單。

*   **情境**：
    *   權限移轉 (Primary Manager Assignment)
    *   新增細部權限 (Add Granular User)
    *   新展店精靈的店長指派 (New Store Wizard)
*   **過濾規則**：
    ```javascript
    const filteredStaff = staffList.filter(staff => {
        if (currentBusinessSystem === 'all') return true;
        return staff.businessSystem === currentBusinessSystem;
    });
    ```
*   **目的**：防止在中醫體系的門市中，誤選到醫美體系的員工。

### 3.5 分類篩選按鈕 (Filter Buttons)
門市列表上方的快速篩選按鈕（全部/醫美/養生/其他）需動態調整：

*   **選中醫體系時**：隱藏「養生」按鈕，將「醫美」按鈕文字改為「中醫」，或顯示專屬的「中醫」篩選按鈕。
*   **選星辰集團時**：顯示標準的「醫美」、「養生」按鈕。

---

## 4. 假資料範例 (Mock Data Examples)

### 4.1 中醫門市 (Stores)
```javascript
[
    { code: 'NJ_TCM', name: '南京京都堂', roleEmail: '...', primaryManager: { name: '南京店長' }, businessSystem: 'tcm' },
    { code: 'SC_LST', name: '三重麗水堂', roleEmail: '...', primaryManager: { name: '三重店長' }, businessSystem: 'tcm' },
    { code: 'TCM_HQ', name: '中醫總部', roleEmail: '...', primaryManager: null, businessSystem: 'tcm' }
]
```

### 4.2 中醫人員 (Staff)
```javascript
[
    { id: 'T001', name: '張醫師', nickname: 'Dr. Zhang', role: '院長', businessSystem: 'tcm' },
    { id: 'T002', name: '李店長', nickname: '', role: '店長', businessSystem: 'tcm' },
    { id: 'T003', name: '王諮詢', nickname: 'Consultant Wang', role: '諮詢師', businessSystem: 'tcm' }
]
```

### 4.3 既有人員標記 (Existing Staff)
既有 `S001` ~ `S025` 員工，需補上 `businessSystem: 'guangze'`。

---

## 5. 實作檢查表 (Implementation Checklist)

- [ ] 在 `index.html` <script> 區塊定義 `BUSINESS_SYSTEMS`。
- [ ] 實作 `setBusinessSystem(system)` 函式，處理切換邏輯。
- [ ] 更新 `renderStores()` 以支援中醫 Icon (`fa-leaf`)。
- [ ] 更新 `getFilteredStores()` 加入體系過濾判斷。
- [ ] 更新 `updateStoreCounts()` 與 Header HTML 以正確顯示各體系統計。
- [ ] **重要**：更新 `populateStaffSelect()`，確保人員清單隨體系連動。
- [ ] **重要**：更新 `populateWizardManagerSelect()`，確保新展店流程的人員清單正確。
- [ ] 補齊中醫門市與中醫人員的 Mock Data。

---

## 6. UI 預覽 (UI Preview)

### 切換至「中醫體系」時：
*   **頂部**：顯示「中醫體系」與綠色葉子 Icon。
*   **列表**：只列出「京都堂」、「麗水堂」等門市。
*   **操作**：點擊「加人」，下拉選單只會出現「張醫師」、「李店長」等中醫員工，不會出現原本的「Alice」、「Tina」。
