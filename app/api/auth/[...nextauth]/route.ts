import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Pointing to your new lib file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };