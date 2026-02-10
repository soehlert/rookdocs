# RookDocs

RookDocs is a modern, developer-centric documentation viewer that treats your local Git repositories as the source of truth.

## Features

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Local Repos** | ✅ | Connect any local folder or clone remote Git repos. |
| **Markdown** | ✅ | Full GFM support including tables and code highlighting. |
| **Search** | ✅ | Fast, client-side search across all connected docs. |
| **Private Repos**| ✅ | robust support for private repos with Fine-grained PATs. |
| **Mermaid** | 🚧 | Diagram support (testing below). |

## Architecture

```mermaid
graph TD
    A[User] -->|Browser| B(React Frontend)
    B -->|API Calls| C{FastAPI Backend}
    C -->|Git Operations| D[Git CLI]
    C -->|File System| E[Local Storage]
    D -->|Clone/Pull| F((GitHub/Remote))
    
    subgraph Frontend
    B1[Dashboard]
    B2[Markdown Renderer]
    B3[Search Index]
    end
    
    subgraph Backend
    C1[Repo Manager]
    C2[File Service]
    end
```

3.  Start with `make dev`.

## Screenshots

### Dashboard
![Dashboard](/Users/soehlert/.gemini/antigravity/brain/2b6229cb-5b9f-4f02-b51f-aaba5e7677f5/dashboard_1770765276580.png)

### Repository Management
![Settings](/Users/soehlert/.gemini/antigravity/brain/2b6229cb-5b9f-4f02-b51f-aaba5e7677f5/settings_1770765280860.png)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
