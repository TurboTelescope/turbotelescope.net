"use client";

import { PipelineHealth } from "@/components/PipelineHealth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <div className="fixed bottom-5 right-5 z-50">
                <ThemeToggle />
            </div>
            <Suspense fallback={<p>Loading...</p>}>
                <PipelineHealth />
            </Suspense>
        </>
    );
}
