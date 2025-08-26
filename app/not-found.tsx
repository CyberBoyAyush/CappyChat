/**
 * Next.js 404 Not Found Page
 * 
 * This is the official Next.js 404 page that gets prerendered during build.
 * It's separate from the React Router 404 handling in ChatAppRouter.tsx.
 * This fixes the build error: "<Html> should not be imported outside of pages/_document"
 */

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go Home
          </a>
          
          <div className="text-sm text-muted-foreground">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@avchat.xyz" className="text-primary hover:underline">
                support@avchat.xyz
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
