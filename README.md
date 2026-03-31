# Git Report Pro V2.5 📊

A premium, localized tool designed to automate the generation of professional progress reports directly from Git logs. Version 2.5 introduces the **Ultimate Flow** update with smart leave management, repository health monitoring, and a fully customizable task scheduler.

---

## 🚀 Key Features

*   **📁 Smart Folder Explorer**: Browse local directories directly from the web UI to auto-detect a repository's Git platform (GitHub/Bitbucket), workspace, and name.
*   **🌴 Smart Leave Automation**: New **Leave Range Manager** allows you to block out vacation dates. Recurring tasks are automatically suppressed, and "On Leave" entries are added for you.
*   **🩺 Repository Health Pulse**: Instant repository scanning! Detect missing folders, invalid Git paths, and uncommitted drafts before you generate your report.
*   **🗓️ Multi-Day Tasking**: Select multiple specific days for any recurring task via a modern **Custom Dropdown**.
*   **🗂️ Supervisor Auto-Assignment**: Map supervisors to specific projects in your settings, and the generator will automatically assign them to every commit.
*   **Intelligent Holiday Engine**: Automatically fetches and labels official PH holidays (e.g., "Eid al-Fitr", "Maundy Thursday") live from the cloud.
*   **Supercharged Excel Exports**: Generates formatted `.xlsx` files with **blue clickable hyperlinks** for both tasks and commit hashes.
*   **Semantic Color-Coding**: Automatically highlights Meetings (Blue), Server/DB tasks (Gray), Holidays (Green), and Leave (Orange).

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v14 or higher)
- **Git** (CLI properly authenticated and available in your PATH)

---

## 📖 How to Use

### 1. Identify Yourself
Fill in the **Employee Information** section. The **Git Email Filter** must match the email you use for your commits (e.g., `git config user.email`).

### 2. Connect Your Projects
Click **Add New Project** and use the **Browse** button to open the Folder Explorer. Select your local Git repository, and the tool will automatically detect the Git Platform, Workspace, and Name.
- **Pro-Tip**: Use the **Health Check** button to verify all your paths are valid and up to date before generating!

### 3. Setup Recurring & Leave
In the **Defaults & Holidays** tab:
- **Recurring Tasks**: Add multi-day tasks (e.g., Mon & Fri meetings).
- **Leave Manager**: Toggle "Range Mode" to block out whole weeks of vacation in one entry.

### 4. Review & Refine
Click **Generate Now** to open the Preview Modal. 
- Use the **Search Bar** to filter rows.
- **Edit Supervisors**: Change a supervisor for a specific row directly in the table if needed.
- **Edit remarks** directly in the table to fix commit typos or add detail.

### 5. Export
Click **Export to Excel**. Your professional report is saved with a standardized filename: `PR - [Name] - [Date].xlsx`.

---

## 📁 Installation

```bash
git clone https://github.com/Mikcas1106/pr-generator.git
cd pr-generator
npm install
npm run dev
```

The application will be available at: **http://localhost:3001**

---

## 🛡️ Privacy & Security
This tool runs **locally**. Your source code and access tokens never leave your computer. The holiday engine uses public APIs and does not share any user data.

---

&copy; 2026 Git Report Pro | Built for Engineering Efficiency.
