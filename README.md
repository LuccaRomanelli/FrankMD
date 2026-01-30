# WebNotes

A simple, feature-rich, self-hosted markdown note-taking app built with Ruby on Rails 8. Designed for blog writers and anyone who wants a clean, distraction-free writing environment with their notes stored locally.

## Why WebNotes?

- **No database** - Notes are plain markdown files on your filesystem
- **Self-hosted** - Your data stays on your machine or server
- **Docker-ready** - One command to start writing
- **Blog-friendly** - Perfect for drafting posts with live preview

## Features

### Editor
- Clean, distraction-free writing interface
- Syntax highlighting for markdown
- Auto-save with visual feedback
- Typewriter mode (keeps cursor centered)
- Customizable fonts and sizes
- Multiple color themes (light/dark variants)

### Organization
- Nested folder structure
- Drag and drop files and folders
- Quick file finder (`Ctrl+P`)
- Full-text search with regex support (`Ctrl+Shift+F`)
- **Hugo blog post support** - Create posts with proper directory structure

### Preview
- Live markdown preview panel
- Synchronized scrolling
- Zoom controls
- GitHub-flavored markdown support

### Media
- **Images**: Browse local images, search web (Bing), Google Images, or Pinterest
- **Videos**: Embed YouTube videos with search, or local video files
- **Tables**: Visual table editor
- **Code blocks**: Language selection with autocomplete

### Integrations
- AWS S3 for image hosting (optional)
- YouTube API for video search (optional)
- Google Custom Search for image search (optional)

## Quick Start

Add this function to your `~/.bashrc` or `~/.zshrc`:

```bash
wn() {
  docker run --rm -p 3000:80 \
    -v "$(realpath "${1:-.}")":/rails/notes \
    akitaonrails/webnotes:latest
}
```

Then reload your shell and run:

```bash
# Open current directory as notes
wn .

# Or open a specific directory
wn ~/my-blog/content

# Open http://localhost:3000
```

Press `Ctrl+C` to stop.

### With Optional Features

For S3 image uploads and YouTube search, export the environment variables first:

```bash
wn() {
  docker run --rm -p 3000:80 \
    -v "$(realpath "${1:-.}")":/rails/notes \
    ${IMAGES_PATH:+-v "$(realpath "$IMAGES_PATH")":/rails/images -e IMAGES_PATH=/rails/images} \
    ${AWS_ACCESS_KEY_ID:+-e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"} \
    ${AWS_SECRET_ACCESS_KEY:+-e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"} \
    ${AWS_S3_BUCKET:+-e AWS_S3_BUCKET="$AWS_S3_BUCKET"} \
    ${AWS_REGION:+-e AWS_REGION="$AWS_REGION"} \
    ${YOUTUBE_API_KEY:+-e YOUTUBE_API_KEY="$YOUTUBE_API_KEY"} \
    ${GOOGLE_API_KEY:+-e GOOGLE_API_KEY="$GOOGLE_API_KEY"} \
    ${GOOGLE_CSE_ID:+-e GOOGLE_CSE_ID="$GOOGLE_CSE_ID"} \
    akitaonrails/webnotes:latest
}
```

Then set your keys in `~/.bashrc` or `~/.zshrc`:

```bash
# Optional: Local images directory
export IMAGES_PATH=~/Pictures

# Optional: S3 for image hosting
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_S3_BUCKET=your-bucket
export AWS_REGION=us-east-1

# Optional: YouTube video search
export YOUTUBE_API_KEY=your-youtube-api-key

# Optional: Google image search
export GOOGLE_API_KEY=your-google-api-key
export GOOGLE_CSE_ID=your-search-engine-id
```

### Running in Background

To run as a persistent service:

```bash
# Start in background
docker run -d --name webnotes -p 3000:80 \
  -v ~/notes:/rails/notes \
  --restart unless-stopped \
  akitaonrails/webnotes:latest

# Stop
docker stop webnotes

# Start again
docker start webnotes

# Remove
docker rm -f webnotes
```

### Using Docker Compose

For a more permanent setup, create a `docker-compose.yml`:

```yaml
services:
  webnotes:
    image: akitaonrails/webnotes:latest
    container_name: webnotes
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - ./notes:/rails/notes
    environment:
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
```

```bash
# Generate secret and start
echo "SECRET_KEY_BASE=$(openssl rand -hex 64)" > .env
docker compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NOTES_PATH` | Directory where notes are stored | `./notes` |
| `IMAGES_PATH` | Directory for local images | (disabled) |
| `SECRET_KEY_BASE` | Rails secret key (required in production) | - |

### Optional: Image Hosting (AWS S3)

To upload images to S3 instead of using local paths:

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |

### Optional: YouTube Search

To enable YouTube video search in the video dialog:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable "YouTube Data API v3"
3. Create an API key under Credentials

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | Your YouTube Data API key |

### Optional: Google Image Search

To enable Google Images tab (in addition to the free Bing/web search):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable "Custom Search API"
3. Create an API key under Credentials
4. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
5. Create a search engine with "Search the entire web" enabled
6. Enable "Image search" in settings
7. Copy the Search Engine ID (cx value)

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Your Google API key |
| `GOOGLE_CSE_ID` | Your Custom Search Engine ID |

Note: Google Custom Search has a free tier of 100 queries/day.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New note |
| `Ctrl+S` | Save now |
| `Ctrl+P` | Find file by path |
| `Ctrl+Shift+F` | Search in file contents |
| `Ctrl+E` | Toggle sidebar |
| `Ctrl+B` | Toggle typewriter mode |
| `Ctrl+Shift+P` | Toggle preview panel |
| `F1` | Markdown help |

## Hugo Blog Post Support

WebNotes includes built-in support for creating Hugo-compatible blog posts. When you click the "New Note" button (or press `Ctrl+N`), you can choose between:

- **Empty Document** - A plain markdown file
- **Hugo Blog Post** - A properly structured Hugo post

### Hugo Post Structure

When you create a Hugo blog post with a title like "My Amazing Post Title", WebNotes will:

1. Create the directory structure: `YYYY/MM/DD/my-amazing-post-title/`
2. Create `index.md` inside with Hugo frontmatter:

```yaml
---
title: "My Amazing Post Title"
slug: "my-amazing-post-title"
date: 2026-01-30T14:30:00-0300
draft: true
tags:
-
---
```

### Slug Generation

The slug is automatically generated from the title:
- Converts to lowercase
- Replaces accented characters (á→a, é→e, ç→c, ñ→n, etc.)
- Removes special characters
- Replaces spaces with hyphens

Examples:
- "Conexão à Internet" → `conexao-a-internet`
- "What's New in 2026?" → `whats-new-in-2026`
- "Código & Programação" → `codigo-programacao`

## Remote Access with Cloudflare Tunnel

For secure remote access without opening ports:

1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

2. Authenticate:
   ```bash
   cloudflared tunnel login
   ```

3. Create a tunnel:
   ```bash
   cloudflared tunnel create webnotes
   ```

4. Add to your `docker-compose.yml`:
   ```yaml
   services:
     webnotes:
       # ... existing config ...

     cloudflared:
       image: cloudflare/cloudflared:latest
       container_name: cloudflared
       restart: unless-stopped
       command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
       environment:
         - CLOUDFLARE_TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
       depends_on:
         - webnotes
   ```

5. Configure the tunnel in Cloudflare Zero Trust dashboard to point to `http://webnotes:80`

6. Add your tunnel token to `.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
   ```

7. Access via your configured domain (e.g., `notes.yourdomain.com`)

**Security Note**: Consider adding Cloudflare Access policies to restrict who can access your notes.

## Development

### Requirements

- Ruby 3.4+
- Node.js 20+ (for Tailwind CSS)
- Bundler

### Setup

```bash
# Clone the repository
git clone https://github.com/akitaonrails/webnotes.git
cd webnotes

# Install Ruby dependencies
bundle install

# Start development server (includes Tailwind watcher)
bin/dev
```

Visit `http://localhost:3000`

### Running Tests

```bash
# Run all tests
bin/rails test

# Run specific test file
bin/rails test test/controllers/notes_controller_test.rb

# Run with verbose output
bin/rails test -v
```

### Project Structure

```
app/
├── controllers/
│   ├── notes_controller.rb    # Note CRUD operations
│   ├── folders_controller.rb  # Folder management
│   ├── images_controller.rb   # Image browsing & S3 upload
│   └── youtube_controller.rb  # YouTube search API
├── services/
│   ├── notes_service.rb       # File system operations
│   └── images_service.rb      # Image handling & S3
├── javascript/
│   └── controllers/
│       ├── app_controller.js  # Main Stimulus controller
│       └── theme_controller.js # Theme management
└── views/
    └── notes/
        └── index.html.erb     # Single-page app
```

### Building Docker Image

```bash
# Build locally
docker build -t webnotes .

# Run locally
docker run -p 3000:80 -v $(pwd)/notes:/rails/notes webnotes
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bin/rails test`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request
