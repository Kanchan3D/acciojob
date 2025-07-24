# AI-Driven Micro-Frontend Playground

A stateful, AI-driven micro-frontend playground where users can iteratively generate, preview, tweak, and export React components, with all chat history and code edits preserved across logins.

## 🚀 Features

- **AI-Powered Code Generation**: Generate React components using natural language with Google Gemini AI
- **Live Code Editor**: Edit, preview, and export code with syntax highlighting and TypeScript support
- **Session Management**: Save multiple sessions with chat history and code changes preserved
- **Real-time Chat**: Interactive AI assistant for coding help and component generation
- **Authentication System**: Secure login/register system with persistent sessions
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15.4.3, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with persistence
- **AI Integration**: Google Gemini AI
- **Code Highlighting**: React Syntax Highlighter with Prism
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AccioJob/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your Gemini API key from: https://makersuite.google.com/app/apikey

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

### Getting Started

1. **Home Page**: Visit the landing page to learn about features
2. **Authentication**: Sign up or log in (demo credentials work for testing)
3. **Playground**: Access the main development environment

### Using the Playground

1. **AI Chat Panel** (Left Side):
   - Type natural language requests to generate React components
   - Ask for help with coding questions
   - View chat history preserved across sessions

2. **Code Editor Panel** (Right Side):
   - View generated code with syntax highlighting
   - Edit code directly in the editor
   - Copy or download generated components
   - Preview components (sandbox ready)

3. **Session Management** (Left Sidebar):
   - Save current work as named sessions
   - Load previous sessions
   - View session history and metadata
   - Delete unused sessions

### Example Prompts

- "Create a button component with variants"
- "Build a login form with validation"
- "Generate a card component with props"
- "Make a responsive navigation bar"
- "Create a modal dialog component"
