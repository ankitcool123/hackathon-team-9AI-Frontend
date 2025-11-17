🚀 AI-Powered Azure Boards Prompt Generator (Frontend UI)
This project provides a React + TypeScript + Vite--based user interface for generating project management content using AI.\ The UI allows users to craft prompts that generate Epics, Features, and User Stories for Azure Boards.

📂 Project Structure
/components
  ├─ ADOExportModal.tsx
  ├─ Dashboard.tsx
  ├─ DocumentationDisplay.tsx
  ├─ ErrorMessages.tsx
  ├─ Header.tsx
  ├─ HistoryPanel.tsx
  ├─ InputArea.tsx
  ├─ Loader.tsx
  ├─ Login.tsx
  ├─ ResultsDisplay.tsx
  ├─ SettingsPanel.tsx
  ├─ WelcomeMessage.tsx

/services
  ├─ adoService.ts
  ├─ geminiService.ts

App.tsx  
index.tsx  
index.html  
vite.config.ts  
package.json  
tsconfig.json  
🧠 How It Works
User enters a description/prompt of the project.\
The frontend calls AI to generate structured work items:
Epics\
Features\
User Stories\
User can then export these items to Azure Boards via Azure DevOps APIs.
🏁 Getting Started
Prerequisites
Node.js (16+)
npm
Install Dependencies
npm install
Start Development Server
npm run dev
🌐 Technologies Used
React (TypeScript)
Vite
Azure DevOps REST API
AI Model Integration (Gemini / OpenAI / Llama)
📦 Build for Production
npm run build
🤝 Contribution
Pull requests and suggestions are welcome.

📄 License
This project is for personal or internal use unless otherwise specified.
