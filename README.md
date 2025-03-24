 # SecureFiles

A modern, secure file management system with end-to-end encryption, built with React and Supabase.

## Features

### Security
- End-to-end encryption for file storage
- Password protection for sensitive files
- Client-side encryption/decryption
- Secure file sharing with granular permissions
- Malware and threat detection

### User Interface
- Modern, responsive design
- Dark/Light theme support
- Intuitive file organization
- Drag-and-drop file upload
- File preview capabilities

### Authentication
- Email/Password authentication
- Magic link login support
- Two-factor authentication ready
- Session management

### File Management
- Folder creation and navigation
- File metadata viewing
- Advanced search capabilities
- File sharing with permission levels
- File type restrictions

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  ├── components/     # UI components
  ├── hooks/          # Custom React hooks
  ├── lib/            # Utility functions
  ├── pages/          # Page components
  └── integrations/   # External service integrations
```

## Security Features

- AES-GCM encryption with 256-bit keys
- Client-side encryption for end-to-end privacy
- Password-derived key option using PBKDF2
- Role-based access control
- Input sanitization and validation
- Protection against XSS and CSRF attacks

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

## License

MIT
