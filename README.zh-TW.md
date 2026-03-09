[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[English](README.md)

---

# SillyTavern 擴充功能面板管理器

一個讓你自由整理 SillyTavern 擴充功能設定頁面的插件。隱藏用不到的面板、調整排列順序、在左右兩欄之間移動——所有設定自動儲存，下次開啟頁面即自動還原。

## 核心功能

- **顯示 / 隱藏面板**：透過勾選框控制各個擴充功能面板的可見性。隱藏的面板仍保持安裝狀態，只是不再顯示在畫面上。
- **拖拽排序**：在管理模式中直接拖拽面板進行重新排列，支援同欄調順序或跨欄移動。
- **持久化配置**：版面設定（可見性、順序、欄位位置）儲存至 `localStorage`，每次載入頁面自動套用。
- **安全取消**：編輯期間點擊取消，所有變更都會還原回修改前的狀態。
- **零相依性**：輕量設計，直接整合進現有的擴充功能介面。

## 使用教學

1. 在 SillyTavern 介面中開啟【Extensions】分頁。
2. 點擊 **管理面板** 按鈕（位於「Install Extension」按鈕旁）。
3. 進入編輯模式：
   - 所有面板變為可見（原本隱藏的面板以半透明顯示）。
   - 每個面板標題列出現**勾選框**，可切換顯示/隱藏。
   - 從標題列拖拽任意面板進行排序，或拖到另一欄改變欄位。
4. 點擊**確認**按鈕儲存設定，或點擊**取消**按鈕還原至修改前的版面。

## 安裝方式

1. 複製儲存庫連結：`https://github.com/lilminzyu/ST-ExtPanel`
2. 在 SillyTavern 介面中開啟【Extensions】分頁。
3. 點擊右上角【Install Extension】。
4. 貼上連結並安裝。
5. 安裝後請確認 **Extension Panel Manager** 已啟用。

## 授權

本專案依 [LICENSE](LICENSE) 條款授權。
