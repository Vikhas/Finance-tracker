# Money Manager

Money Manager is a modern, user-friendly application designed to help you track your finances with ease. It provides a comprehensive suite of tools to manage your income and expenses, offering a clear overview of your financial health. With features like manual transaction input, Gmail integration for automatic transaction importing, and an AI-powered assistant, Money Manager is your all-in-one solution for personal finance management.

## Features

- **Dashboard**: A centralized view of your financial status, including your current balance, recent transactions, and a summary of your spending habits.
- **Manual Transaction Input**: Easily add new transactions with details such as amount, category, and date.
- **Gmail Integration**: Automatically import transactions from your Gmail account by scanning for receipts and financial statements.
- **AI Assistant**: Get insights into your spending, ask financial questions, and receive personalized advice from an intelligent AI chatbot.
- **Secure Authentication**: User accounts are protected with Supabase authentication, ensuring your financial data is safe and private.

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Supabase](https://supabase.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/money-manager.git
   cd money-manager
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Supabase:**

   - Create a new project on [Supabase](https://supabase.io/).
   - In your Supabase project, navigate to **Settings** > **API**.
   - Create a `.env` file in the root of your project and add the following environment variables:

     ```
     VITE_SUPABASE_URL=YOUR_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     ```

     Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your Supabase project's URL and anon key.

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application should now be running on `http://localhost:5173`.

## Usage

1. **Authentication**: When you first open the application, you will be prompted to sign up or log in using your email and password.
2. **Dashboard**: After logging in, you will see your dashboard, which provides an overview of your finances.
3. **Add Transactions**: Click on the "Add Transactions" tab to manually input new income or expenses.
4. **Gmail Integration**: Navigate to the "Gmail" tab to connect your Gmail account and automatically import transactions.
5. **AI Assistant**: Use the "AI Assistant" tab to ask questions about your spending habits or get financial advice.
