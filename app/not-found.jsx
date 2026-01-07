import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-25 px-4 text-center">
            <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4"></h2>
            <p className="text-gray-600 mb-8">
                Oops! The Page you are looking doesn't exist or
                has been moved
            </p>
            <Link href="/">
                <Button>Return Home</Button>
            </Link>
        </div>
    )
}