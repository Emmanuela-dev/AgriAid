import type { Metadata } from "next";
import "./globals.css";
import NavigationState from "@/context/NavigationState";
import UserState from "@/context/UserState";
import LabState from "@/context/LabState";
import YardState from "@/context/YardState";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AgriAid",
  description:
    "AgriAid is a revolutionary AI-driven agricultural solution designed to simplify and enhance the lives of farmers globally."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <link
          href="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <UserState>
          <Toaster position="top-right" />
          <NavigationState>
            <YardState>
              <LabState>{children}</LabState>
            </YardState>
          </NavigationState>
        </UserState>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
