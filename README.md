# CodePractice

> Stop grinding blindly. Practice smart.
> 
> CodePractice is a fully-featured, engineer-first interview preparation and tracking suite designed to provide deep analytics, seamless task management, and structured practice routines.

### 🔗 [Access Companywise Questions Here](./companies_questions)

![CodePractice Dashboard](/public/images/favicon.ico)

## 📁 Repository Structure

The interview preparation environment relies on two core folders designed to work in tandem:

1. `company_questions`: The primary data reservoir. This folder contains raw CSV data detailing interview problems categorized by real-world companies.
2. `code practice` (This repository): The front-end application and prebuild pipeline that ingests the CSV data, compiles it, and renders the stunning interactive interface.

## ✨ Features

- **Dynamic Company-Specific Practice**: Ingests hundreds of CSVs to show you exactly what problems are being asked at Meta, Google, Amazon, etc. Filter by difficulty, frequency, and custom topics.
- **Advanced Planner & Pomodoro**: A dedicated offline-first Task Planner featuring Day, Week, Month, and Year layouts. Features a pop-out customizable Pomodoro Timer that synchronizes directly with your browser's tab title to keep you focused.
- **Developer-Grade Analytics**: A rich Dashboard featuring an authentic GitHub-style 52-week Contribution Heatmap tracking exactly when you solve which problems.
- **Premium Dark Mode**: Built with deep AMOLED-style `#0a0a0a` backgrounds matched with `#1c1c1e` and `#242428` elevated utility cards to prevent "black crush" and deliver a clean, professional aesthetic.
- **Local-First & Blazing Fast**: No logins, no database latency. State is persisted locally via Zustand and data is statically generated at build-time using our robust TurboPack pipeline and prebuild scripts.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed along with `npm`. 

### Installation

1. **Clone the repositories**:
   Ensure that the data repository (`company_questions`) and the codebase (`code practice`) exist side-by-side or adjust paths in `scripts/prebuild.ts`.

2. **Install Dependencies**:
   ```bash
   cd "code practice"
   npm install
   ```

3. **Prebuild Data Generation**:
   CodePractice relies on a custom `tsx` pipeline to fuse local firm data with topic classifications. Generate your internal `.json` data blobs:
   ```bash
   npm run prebuild
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *Navigate to `http://localhost:3000` to view the application.*

## 💻 Tech Stack
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Typography**: Inter (Google Fonts)

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Made with ❤ By [Anshul](https://github.com/Anshul)**
