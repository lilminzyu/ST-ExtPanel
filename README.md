[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[中文 (繁體)](README.zh-TW.md)

---

# Extension Panel Manager for SillyTavern

A SillyTavern extension that lets you customize the Extensions settings page — hide panels you don't use, reorder them, and move them between columns. Settings are saved automatically and restored on every page load.

## Key Features

- **Show / Hide Panels**: Toggle visibility of any extension panel with a checkbox. Hidden panels remain installed — they just won't clutter the screen.
- **Drag & Drop Reorder**: Drag panels to rearrange them within or across columns. Cross-column drag is fully supported.
- **Persistent Layout**: Your layout (visibility, order, column placement) is saved to `localStorage` and applied automatically on page load.
- **Non-destructive**: Canceling edit mode fully restores the previous state. No settings are changed until you confirm.
- **Lightweight**: No dependencies. Integrates directly into the existing Extensions UI.

## Usage

1. Open the **Extensions** tab in SillyTavern.
2. Click the **管理面板** button (next to the "Install Extension" button).
3. Edit mode activates:
   - All panels become visible (hidden ones appear at reduced opacity).
   - Each panel shows a **checkbox** to toggle visibility.
   - Drag any panel by its header to reorder or move it to another column.
4. Click the **confirm** button to save, or the **cancel** button to restore the previous layout.

## Installation

1. Copy the repository URL: `https://github.com/lilminzyu/ST-ExtPanel`
2. Open the **Extensions** tab in SillyTavern.
3. Click **Install Extension** (top-right).
4. Paste the URL and install.
5. Ensure **Extension Panel Manager** is enabled in the list.

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.
