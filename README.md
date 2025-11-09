# Money Manager

Money Manager is a modern, user-friendly application designed to help you track your finances with ease. It provides a comprehensive suite of tools to manage your income and expenses, offering a clear overview of your financial health. With features like manual transaction input, Gmail integration for automatic transaction importing, and an AI-powered assistant, Money Manager is your all-in-one solution for personal finance management.

## Features

- **Dashboard**: A centralized view of your financial status, including your current balance, recent transactions, and a summary of your spending habits.
- **Manual Transaction Input**: Easily add new transactions with details such as amount, category, and date.
- **Gmail Integration**: Connect your Gmail account to automatically import transactions. This feature uses Supabase functions to securely fetch and parse your emails for financial information, such as receipts and statements, saving you the hassle of manual data entry.
- **AI Assistant**: Leverage the power of the Gemini API to gain intelligent insights into your spending habits. Ask the AI assistant questions about your finances, and receive personalized advice and analysis to help you make smarter financial decisions.
- **Secure Authentication**: User accounts are protected with Supabase authentication, ensuring your financial data is safe and private.

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Supabase](https://supabase.io/)
  - **Authentication**: Manages user sign-up and login.
  - **Database**: Stores transaction and user data.
  - **Functions**:
    - `gmail-callback`: Handles OAuth for Gmail integration.
    - `fetch-gmail`: Retrieves emails from the user's Gmail account.
    - `parse-gmail`: Extracts transaction data from emails using the Gemini API.
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
     VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
     ```

     Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your Supabase project's URL and anon key.
     Replace `YOUR_GEMINI_API_KEY` with your Google Gemini API key.

4. **Deploy Supabase Functions:**

   To deploy the Supabase functions, run the following command:

   ```bash
   npx supabase functions deploy
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application should now be running on `http://localhost:5173`.

## Project Structure

The project is organized into two main parts: the frontend application and the backend services.

- **Frontend (`src/`)**:
  - `components/`: Contains reusable React components.
  - `lib/`: Includes utility functions and Supabase client initialization.
  - `App.tsx`: The main application component.
  - `main.tsx`: The entry point of the React application.

- **Backend (`supabase/`)**:
  - `functions/`: Houses the Supabase edge functions for handling server-side logic.
    - `gmail-callback/`: Manages the OAuth callback for Gmail integration.
    - `fetch-gmail/`: Fetches emails from the user's Gmail account.
    - `parse-gmail/`: Parses emails to extract transaction data.
  - `migrations/`: Contains database schema migrations.

## Available Scripts

In the project directory, you can run the following commands:

- **`npm run dev`**: Runs the app in the development mode.
- **`npm run build`**: Builds the app for production to the `dist` folder.
- **`npm run lint`**: Lints the code using ESLint.
- **`npm run preview`**: Serves the production build locally for preview.
- **`npm run typecheck`**: Runs the TypeScript compiler to check for type errors.

## Usage

1. **Authentication**: When you first open the application, you will be prompted to sign up or log in using your email and password.
2. **Dashboard**: After logging in, you will see your dashboard, which provides an overview of your finances.
3. **Add Transactions**: Click on the "Add Transactions" tab to manually input new income or expenses.
4. **Gmail Integration**: Navigate to the "Gmail" tab to connect your Gmail account and automatically import transactions.
5. **AI Assistant**: Use the "AI Assistant" tab to ask questions about your spending habits or get financial advice.

## Contributing

Contributions are welcome! Please open an issue to discuss your ideas or submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
