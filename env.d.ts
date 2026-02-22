/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />

// Vite ?url suffix imports
declare module "*.css?url" {
  const url: string;
  export default url;
}
