# Git Report Pro V2.1 📊

A premium, localized tool designed to automate the generation of professional progress reports directly from Git logs. Version 2.1 introduces a intelligent holiday engine, multi-project support, and interactive report previews.

---

## 🚀 Key Features

*   **Intelligent Holiday Engine**: Automatically fetches and labels official holidays (e.g., "Eid al-Fitr", "Maundy Thursday") live from the cloud.
*   **Supercharged Excel Exports**: Generates formatted `.xlsx` files with **blue clickable hyperlinks** for both tasks and commit hashes.
*   **Semantic Color-Coding**: Automatically highlights Meetings (Blue), Server/DB tasks (Gray), and Holidays (Green) in the final report.
*   **Interactive Preview Modal**: Review, reclassify (e.g., Change "Normal" to "Meeting"), search, and edit remarks before exporting.
*   **Multi-Project Capability**: Link dozens of local repositories and generate a unified report in one click.
*   **Accurate Deletion Guard**: Secure confirmation modals for project and task removal with real-time name tracking.

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
Add your local repository paths. Use the full directory path (e.g., `C:\Projects\my-repo`). The tool will automatically detect the Git history.

### 3. Setup Recurring Tasks
In the **Defaults & Holidays** tab, add your weekly meetings or standard tasks. Use the "Only if project has commits" toggle to ensure tasks only appear on days you were active on that project.

### 4. Review & Refine
Click **Generate Now** to open the Preview Modal. 
- Use the **Search Bar** to filter rows.
- **Toggle checkboxes** to exclude specific days or warnings.
- **Edit remarks** directly in the table to fix commit typos.

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
