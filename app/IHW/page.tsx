"use client";

import { PipelineHealth } from "@/components/PipelineHealth";
import { ModeToggle } from "@/components/ThemeToggle";
import { Suspense } from "react";

export default function Page() {
    return (
        <>
            <div className="fixed bottom-5 right-5 z-50">
                <ModeToggle />
            </div>
            <Suspense fallback={<p>Loading...</p>}>
                <PipelineHealth />
            </Suspense>
        </>
    );
}
