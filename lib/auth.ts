import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { DB_NAME } from "@/lib/mongodb";


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
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and other details to the token
      if (account) {
        let isInstalled = false;
        try {
            const { checkAppInstalled } = await import("@/lib/github-app");
            isInstalled = await checkAppInstalled(account.access_token || "");
            
            // Sync with DB if installed
            if (isInstalled && user?.id) {
                const { ObjectId } = await import("mongodb");
                const client = await clientPromise;
                const db = client.db(DB_NAME);
                await db.collection("users").updateOne(
                    { _id: new ObjectId(user.id) },
                    { 
                        $set: { 
                            appInstalled: true,
                            lastAppCheck: new Date()
                        } 
                    }
                );
            }
        } catch (error) {
            console.error("Error checking app installation on login:", error);
        }

        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
          user: token.user,
          appInstalled: isInstalled,
          lastAppCheck: Date.now(),
        };
      }

      // If the token has not expired yet, return it
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        
        // --- 1. Periodic Re-verification (Every 5 minutes) ---
        // If we believe it is installed, verify with GitHub occasionally to handle uninstalls
        if (token.appInstalled && token.accessToken) {
            const lastCheck = (token.lastAppCheck as number) || 0;
            // 5 minutes interval
            if (Date.now() - lastCheck > 300000) { 
                try {
                    const { checkAppInstalled } = await import("@/lib/github-app");
                    const isStillInstalled = await checkAppInstalled(token.accessToken as string);

                    // Update check time
                    token.lastAppCheck = Date.now();

                    if (!isStillInstalled) {
                        console.log("Periodic check: App uninstalled. Updating DB.");
                        token.appInstalled = false;
                        
                        // Update DB
                        const { ObjectId } = await import("mongodb");
                        const client = await clientPromise;
                        const db = client.db(DB_NAME);
                        if (token.sub) {
                            await db.collection("users").updateOne(
                                { _id: new ObjectId(token.sub) },
                                { $set: { appInstalled: false } }
                            );
                        }
                    }
                } catch (e) {
                    // Fail silent on transient errors to avoid locking user out on network blips
                    console.error("Error periodic app check", e);
                }
            }
        }

        // --- 2. Database Sync (If false/unknown) ---
        // If appInstalled is not set or false, check the database once
        // This decouples the session check from external API rate limits
        if (!token.appInstalled && token.sub) {
            try {
                const { ObjectId } = await import("mongodb");
                // dynamic import to avoid circular dependencies if any, though clientPromise is top level
                const client = await clientPromise;
                const db = client.db(DB_NAME);
                const user = await db.collection("users").findOne(
                    { _id: new ObjectId(token.sub) },
                    { projection: { appInstalled: 1 } }
                );
                
                if (user?.appInstalled) {
                    token.appInstalled = true;
                    // Initialize check time so we don't immediately re-check
                    token.lastAppCheck = Date.now();
                }
            } catch (e) {
                console.error("Error syncing app installation status from DB", e);
            }
        }
        return token;
      }

      // If the access token has expired, try to update it
      if (token.refreshToken) {
        const newToken = await refreshAccessToken(token);
        // Sync with DB state on token refresh as well
        if (newToken.sub) {
             try {
                const { ObjectId } = await import("mongodb");
                const client = await clientPromise;
                const db = client.db(DB_NAME);
                const user = await db.collection("users").findOne(
                    { _id: new ObjectId(newToken.sub as string) },
                    { projection: { appInstalled: 1 } }
                );
                
                if (user?.appInstalled) {
                    newToken.appInstalled = true;
                }
             } catch (e) {
                console.error("Error syncing app installation status from DB after refresh", e);
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
    maxAge: 60 * 60, // 1 hour
    updateAge: 5 * 60, // 5 minutes
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
