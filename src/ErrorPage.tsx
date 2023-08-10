import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <h1 className="text-6xl font-bold">Error</h1>
      <p className="py-8">Sorry, an unexpected error has occurred:</p>
      <p className="py-8">
        <i>{error.statusText || error.message}</i>
      </p>
      <a href="/">Back home</a>
    </div>
  );
}