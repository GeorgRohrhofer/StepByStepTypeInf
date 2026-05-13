// View layer — pure presentational component.
//
// Renders a feature-level error message. Lives inside the type-inference
// feature because the error texts it shows are pipeline errors. If error
// banners become shared across multiple features later, this can be lifted
// into `shared/components/`.

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      {message}
    </div>
  );
}
