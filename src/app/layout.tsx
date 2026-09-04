import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RouteProvider } from "@/providers/router-provider";
import { Theme } from "@/providers/theme";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";
import { HeaderNavigationBase } from "./components/navigation/header-navigation";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "BenBarrett89",
    description: "My GitHub page",
};

export const viewport: Viewport = {
    themeColor: "#7f56d9",
    colorScheme: "light dark",
};

const headerNavigationItems = [
    { label: "Home", href: "/" },
    { label: "Fateforge", href: "/fateforge" },
];

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cx(inter.variable, "bg-primary antialiased")}>
                <RouteProvider>
                    <Theme>
                        <HeaderNavigationBase actions={[]} items={headerNavigationItems} />
                        {children}
                    </Theme>
                </RouteProvider>
            </body>
        </html>
    );
}
