# Git Report Generator Pro 📊

A premium, localized tool designed to automate the generation of formatted CSV reports from Git logs. This tool is specifically tailored to match professional progress report layouts, including automatic task injection (Code/Database Reviews) and scheduled meetings.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v14 or higher)
- **Git** (CLI properly authenticated)

### 2. Installation
Clone this repository and install the required dependencies:
```bash
git clone https://github.com/Mikcas1106/pr-generator.git
cd pr-generator
npm install
```

### 3. Run the Tool
Start the local server:
```bash
node server.js
```
Now, open your browser and navigate to:
👉 **[http://localhost:3001](http://localhost:3001)**

---

## 🛠️ Key Features

- **Automated CSV Formatting**: Automatically inserts "Code Review" and "Database Review" rows for every day that has commits.
- **Meeting Injection**: Detects calendar days and automatically adds "Weekly Alignment Meetings" (Thursday/Friday).
- **Split Column Logic**: Projects (e.g., "TRANSCO IBPPMS") and Supervisors (e.g., "Joyce Digma") are cleanly split into alternating rows for a professional Excel look.
- **Git Clone UI**: Directly clone repositories into a target folder via the dashboard.
- **Premium UI**: Modern, glassmorphic design for a superior user experience.

---

## 📖 How to Use

1. **Repository Folder Path**: Provide the full path to your local Git repository (e.g., `C:\Projects\my-repo`).
2. **Employee Details**: Enter your Name and ID to populate the report header.
3. **Commit Filters**: Specify the **Author Email** and **Date Range** (Since/Until).
4. **Generate**: Click **Generate Now**. The tool executes `git log` behind the scenes and formats your report instantly.
5. **Download**: The formatted `.csv` is saved to your provided output path, ready for Microsoft Excel.

---

## 📁 Project Structure

```text
├── public/          # Frontend (HTML, CSS, JS)
├── server.js        # Backend (Express, Git Automation)
├── package.json     # Node.js dependencies
└── README.md        # Documentation (this file)
```

## 🛡️ Security Note
This tool runs **locally** on your machine. Your source code and access tokens never leave your computer, ensuring complete privacy and security for company-sensitive repositories.

---

&copy; 2026 PR Generator Pro | Built for Engineering Efficiency.
