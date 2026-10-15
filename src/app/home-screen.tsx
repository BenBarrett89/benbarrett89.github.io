"use client";

import { Button } from "@/components/base/buttons/button";

export const HomeScreen = () => {
    return (
        <div className="flex h-dvh flex-col">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 md:px-8">
                <h1 className="max-w-3xl text-center text-display-sm font-semibold text-primary">BenBarrett89</h1>
                <blockquote className="text-tertiary">More to be added</blockquote>
                <div className="mt-4">
                    <Button color="link-color" href="/spotify">
                        Spotify profile demo
                    </Button>
                </div>
            </div>
        </div>
    );
};
