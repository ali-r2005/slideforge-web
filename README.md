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

## 📋 Schema-Driven Forms

The frontend automatically renders dynamic forms based on template schemas defined on the backend.

### Form Rendering

When a template has a schema, the `SchemaForm` component:
1. Loads the schema from `/schema/{template_name}` endpoint
2. Renders form fields based on field definitions
3. Validates input in real-time
4. Groups related fields into organized sections
5. Provides helpful error messages

### Form Groups

Fields can be organized into logical groups with headers and descriptions:

```typescript
interface SchemaGroup {
  name: string              // Group title
  description?: string      // Optional explanatory text
  fields: string[]          // Array of field names
}
```

Groups appear as styled card sections, making large forms easier to navigate. Example:

```
┌─────────────────────────────────┐
│ Contact Information             │
│ Personal and contact details    │
├─────────────────────────────────┤
│ [First Name]                    │
│ [Last Name]                     │
│ [Email]                         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Company Details                 │
│ Business information            │
├─────────────────────────────────┤
│ [Company Name]                  │
│ [Industry]                      │
│ [Employee Count]                │
└─────────────────────────────────┘
```

### Backward Compatibility

- **Templates with schema**: Display dynamic form (schema fields + optional additional context textarea)
- **Templates without schema**: Display text-only prompt textarea (graceful fallback)

## 🎨 UI/UX Philosophy
- **Premium Dark Mode**: Optimized for high-focus creative work.
- **Glassmorphism**: Modern, sleek interface with subtle transitions.
- **Fast Feedback**: Immediate visual updates upon content modification.
- **Smart Form Organization**: Grouped fields reduce cognitive load in complex forms.
