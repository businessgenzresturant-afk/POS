import NextAuth, { type NextAuthOptions, type DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';

// Extend the User type with role
interface ExtendedUser extends DefaultUser {
  role?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role } as ExtendedUser;
        } catch { return null; }
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      const extendedUser = user as ExtendedUser | undefined;
      return extendedUser ? { ...token, role: extendedUser.role, id: extendedUser.id } : token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, role: token.role as string, id: token.id as string }
    })
  },
  secret: process.env.NEXTAUTH_SECRET,
};