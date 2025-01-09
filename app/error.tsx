"use client";

import Link from "next/link";

export default function Custom500() {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>500 - Internal Server Error</h1>
            <p>Something went wrong. Please try again later.</p>
            <Link href="/">
                <a>Go back to Home</a>
            </Link>
        </div>
    );
}
