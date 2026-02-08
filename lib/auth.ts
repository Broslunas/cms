import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { checkAppInstalled } from "@/lib/github-app";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: DB_NAME }),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "repo user:email read:user read:org",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login, // Store GitHub username
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and other details to the token
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
          user: token.user,
          // Check app installation on login
          appInstalled: await checkAppInstalled(account.access_token || ""),
          lastAppCheck: Date.now(),
        };
      }

      // If the token has not expired yet, return it
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        // Cache App Installation Check (5 minutes)
        if (token.accessToken && (token.appInstalled === undefined || Date.now() - ((token.lastAppCheck as number) || 0) > 300000)) {
            try {
                token.appInstalled = await checkAppInstalled(token.accessToken as string);
                token.lastAppCheck = Date.now();
            } catch (e) {
                console.error("Error refreshing app installation status in jwt", e);
            }
        }
        return token;
      }

      // If the access token has expired, try to update it
      if (token.refreshToken) {
        const newToken = await refreshAccessToken(token);
        // Re-check app installation with new token if needed
        if (newToken.accessToken && !newToken.error) {
             try {
                newToken.appInstalled = await checkAppInstalled(newToken.accessToken);
                newToken.lastAppCheck = Date.now();
             } catch (e) {
                console.error("Error refreshing app installation status after token refresh", e);
             }
        }
        return newToken;
      }

      return token;
    },
    async session({ session, token }) {
      // Pass the access token to the session
      session.access_token = token.accessToken as string;
      session.error = token.error as string;

      // Note: In NextAuth v5, user.id comes from the token sub
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      
      // Check if the user has the app installed
      // Now we use the value cached in the token to avoid API calls on every request
      if (token.appInstalled !== undefined) {
         session.appInstalled = token.appInstalled as boolean;
      }
      
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

/**
 * Function to refresh the GitHub access token
 */
async function refreshAccessToken(token: any) {
  try {
    console.log("Attempting to refresh GitHub token...");
    
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      console.error("Error in GitHub response when refreshing token:", tokens);
      throw tokens;
    }

    console.log("Token refreshed successfully.");

    return {
      ...token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + (tokens.expires_in ?? 28800)), // Default 8h if missing
      refreshToken: tokens.refresh_token ?? token.refreshToken, // If no new one is provided, keep the previous one
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
