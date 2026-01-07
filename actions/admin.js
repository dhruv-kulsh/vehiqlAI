"use server"

// currentUser() -> to get full user details (name, EmailAddress, et)
// auth() -> to get user_id, session_id, token etc


import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/prisma"

export async function getAdmin() {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorised")

    const user = await db.user.findUnique({
        where: { "clerkUserId": userId }
    })

    if (!user || user.role !== "ADMIN") {
        return { authorized: false, reason: "not-admin" }
    }

    return { authorized: true, user }

}