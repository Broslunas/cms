# 🚀 Broslunas CMS

A Git-based Content Management System (CMS) designed specifically for the Astro ecosystem. It allows you to manage your Content Collections through an intuitive visual interface, syncing data directly with your GitHub repositories.

![Broslunas CMS](https://img.shields.io/badge/Status-MVP-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## ✨ Features

- 🔐 **GitHub OAuth Authentication** - Secure connection with your GitHub account
- ⚙️ **GitHub App Onboarding** - Guided flow to install and configure permissions
- 📦 **Automatic Import** - Scans and imports Markdown files from your repositories
- ✏️ **Visual Editor** - Modern interface for editing metadata and content
- 🎙️ **Dynamic Fields** - Support for transcriptions and complex fields
- 🔄 **Bidirectional Sync** - MongoDB as cache + Git as source of truth
- ✅ **Zod Validation** - Type-safety throughout the process
- 📝 **Automatic Commits** - Saves changes directly to GitHub

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **Database**: MongoDB (Atlas)
- **Git API**: Octokit
- **Markdown Parsing**: gray-matter
- **Validation**: Zod
- **Styles**: Tailwind CSS v4

## 📋 Prerequisites

- Node.js 20+ and npm
- MongoDB Atlas account (free)
- GitHub account
- **GitHub App** configured (see instructions below)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <your-repo>
cd cms
npm install
```

### 2. Configure MongoDB Atlas

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 - free)
3. Create a database user
4. Get your connection string

### 3. Configure GitHub App

**⚠️ IMPORTANT**: This CMS requires a **GitHub App**, NOT a traditional OAuth App.

**Quick Guide:**

1. Go to [GitHub Apps](https://github.com/settings/apps/new)
2. Configure:
   - **GitHub App name**: Broslunas CMS (or your preference)
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/auth/callback/github`
   - **Webhook**: Disabled
3. **Repository Permissions**:
   - **Contents**: `Read and write` ✅ **VERY IMPORTANT**
   - **Metadata**: `Read-only` (automatic)
4. Save the **Client ID** and generate a **Client Secret**
5. Copy the **App Slug** (appears in the URL after creation)
6. Install the app on your GitHub account

**📚 Complete Documentation**: See [`GITHUB_APP_SETUP.md`](./GITHUB_APP_SETUP.md) for detailed step-by-step instructions.

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/astro-cms?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# GitHub App (NOT OAuth App)
GITHUB_ID=your-github-app-client-id
GITHUB_SECRET=your-github-app-client-secret
GITHUB_APP_NAME=your-github-app-slug
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Run the Project

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### 1. Authentication

1. Click on "Continue with GitHub"
2. Authorize the application
3. You will be redirected to the dashboard

### 2. Import Content

1. In the dashboard, select a repository
2. Click on "Import"
3. The system will scan `src/content/` looking for `.md` and `.mdx` files
4. Posts will be imported into MongoDB

### 3. Edit Posts

1. Click on a post from the list
2. Edit metadata (title, slug, tags, etc.)
3. Edit transcriptions if available
4. Edit markdown content
5. **Save**: Saves only to MongoDB (status: "modified")
6. **Save & Commit**: Saves to MongoDB and commits to GitHub (status: "synced")

## 🏗️ Architecture

```
┌─────────────┐
│   Next.js   │
│  (Frontend) │
└──────┬──────┘
       │
       ├────────────┐
       │            │
       v            v
┌─────────┐  ┌──────────┐
│ MongoDB │  │  GitHub  │
│ (Cache) │  │ (Source) │
└─────────┘  └──────────┘
```

**Data Flow:**

1. **Import**: GitHub → MongoDB
2. **Edit**: UI → MongoDB
3. **Commit**: MongoDB → GitHub (with Markdown serialization)

## 📦 Project Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/ # Auth endpoints
│   ├── repos/              # List repositories
│   ├── import/             # Import content
│   └── posts/              # Post CRUD
├── dashboard/
│   ├── page.tsx            # Main Dashboard
│   ├── repos/              # Post list
│   └── editor/[id]/        # Post editor
components/
├── LoginButton.tsx
├── RepoSelector.tsx
└── PostEditor.tsx
lib/
├── auth.ts                 # NextAuth config
├── mongodb.ts              # MongoDB client
├── octokit.ts              # GitHub API utilities
├── markdown.ts             # Parsing/serialization
├── schemas.ts              # Zod validation
```

## 🔍 Data Model (MongoDB)

```typescript
{
  _id: ObjectId,
  userId: string,              // NextAuth user ID
  repoId: string,              // "owner/repo"
  filePath: string,            // "src/content/blog/post.md"
  sha: string,                 // SHA of the file on GitHub
  
  metadata: {
    title: string,
    slug: string,
    tags: string[],
    episodeUrl?: string,
    transcription?: [{
      time: string,
      text: string
    }]
  },
  
  content: string,             // Markdown body
  status: "synced" | "draft" | "modified",
  lastCommitAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Troubleshooting

### Error: "No GitHub access token found"

- Verify that GitHub scopes include `repo`
- Log out and authenticate again

### Conflict Error (409) when committing

- The file was modified externally
- Sync changes from GitHub or overwrite manually

### Posts not importing

- Verify the repository has a `src/content/` folder
- Verify files have valid frontmatter

## 🗺️ Roadmap

- [x] Phase 1: MVP (Auth, import, basic editor)
- [ ] Phase 2: Advanced dynamic forms
- [ ] Phase 3: Webhooks for real-time sync
- [ ] Phase 4: Media library (image management)
- [ ] Phase 5: Live preview

## 📄 License

MIT

## 🤝 Contributions

Contributions are welcome! Please open an issue or PR.

---

Made with ❤️ for the Astro ecosystem
