---
description: Initial setup guide for first-time GitReport PRO users
---

1. **Profile Personalization**
   - On the **Report Engine** (Main) tab:
   - Enter your **Employee Name** (used for header).
   - Enter your **Employee ID**.
   - **CRITICAL**: Set your **Author / Git Email Filter**. This *must* match the email in your `git config user.email` for the system to find your work.

2. **Repository Registration**
   - Head to the **Projects List** tab.
   - For every project you work on, add a new entry.
   - **Tip**: Copy-paste paths directly from your terminal or File Explorer (e.g., `C:\Work\project-alpha`).
   - Fill in supervisor names (they'll appear automatically in the final Excel rows).

3. **Automate Your Overhead**
   - In the **Defaults & Holidays** tab:
   - Add entries for **Daily Scrum**, **Weekly Syncs**, or **Client Meetings**.
   - These are now saved permanently. You'll never have to type "Scrum Meeting" again. 

4. **Verify Connectivity**
   - Go back to the **Report Engine**.
   - Pick any date range where you know you made commits.
   - Click **Generate Now**.
   - If the **Preview Modal** shows your commits, your Git filter and paths are set up correctly.

5. **Ready for Production**
   - Your configuration is now saved to your browser's local storage.
   - You only need to touch these settings again if you change projects or start a new task.
