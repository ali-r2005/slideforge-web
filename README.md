# SlideForge Web

The modern frontend interface for the SlideForge ecosystem. Built with Next.js, this application provides a seamless experience for generating, previewing, and refining AI-powered PowerPoint presentations.

## ✨ Features

- **Template Browser**: Visual interface to select from available PPTX designs.
- **AI-Driven Generation**: Simple prompt-based workflow to create entire presentations in seconds.
- **Interactive Workspace**: 
    - **Slide Sidebar**: Quick navigation through generated slides.
    - **PDF Previewer**: High-fidelity rendering of your presentation.
    - **Live Editor**: Modify AI-generated content and re-sync with the backend instantly.
- **Dual Export**: Support for both `.pptx` (editable) and `.pdf` (distribution-ready) downloads.
- **Robust Error Handling**: Real-time feedback from the AI validation engine (powered by FastAPI).

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Radix UI / Shadcn UI
- **Icons**: Lucide React
- **API Client**: Axios (with custom interceptors for FastAPI error propagation)
- **State Management**: Zustand

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js 18+ installed.

### 2. Environment Setup
Create a `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Installation
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start generating.

---

## 📁 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/presentation/`: Core logic for the generator form and editor workspace.
- `services/`: Axios-based services to communicate with the SlideForge API.
- `lib/axios.ts`: Central API configuration with advanced error handling.
- `types/`: TypeScript definitions for presentations, templates, and AI responses.

---

## 🎨 UI/UX Philosophy
- **Premium Dark Mode**: Optimized for high-focus creative work.
- **Glassmorphism**: Modern, sleek interface with subtle transitions.
- **Fast Feedback**: Immediate visual updates upon content modification.
