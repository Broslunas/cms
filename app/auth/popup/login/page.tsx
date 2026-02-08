export default async function PopupLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 flex-col px-4 text-center">
      <div className="max-w-sm w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Sign in to Broslunas</h1>
        <p className="text-sm text-gray-500">
          This window will close automatically after login.
        </p>

        <a 
          href="/api/auth/signin/github?callbackUrl=/auth/popup/success"
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 7.123 9.58.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.254-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025a9.564 9.564 0 012.508-.337c.85.004 1.705.115 2.504.337 1.914-1.296 2.753-1.026 2.753-1.026.546 1.379.202 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.685-4.566 4.935.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.522-4.477-10-10-10z"/></svg>
          Continue with GitHub
        </a>
      </div>
    </div>
  )
}
