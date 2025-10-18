# Plan Artifacts Database Schema

## Overview
The `plan_artifacts` collection stores all generated artifacts (MVPs, diagrams, etc.) in Plan Mode.

## Collection Fields

### Required Fields
| Field | Type | Size | Description |
|-------|------|------|-------------|
| `artifactId` | String | 100 | Unique identifier for the artifact |
| `threadId` | String | 100 | ID of the conversation thread |
| `messageId` | String | 100 | ID of the assistant message that generated this artifact |
| `userId` | String | 100 | ID of the user who owns this artifact |
| `type` | String | 20 | Artifact type: `"mvp"` or `"diagram"` |
| `title` | String | 500 | Human-readable title |
| `version` | Integer | Min: 1 | Version number (starts at 1) |

### Optional Fields - MVP Code
| Field | Type | Size | Description |
|-------|------|------|-------------|
| `htmlCode` | String | 1GB | HTML content for MVP |
| `cssCode` | String | 1GB | CSS content for MVP |
| `jsCode` | String | 1GB | JavaScript content for MVP |
| `framework` | String | 50 | Framework type: `"vanilla"`, `"react"`, `"svelte"`, `"vue"` |
| `theme` | String | 20 | Theme: `"light"` or `"dark"` |

### Optional Fields - Diagram
| Field | Type | Size | Description |
|-------|------|------|-------------|
| `diagramType` | String | 50 | Diagram type: `"erd"`, `"flowchart"`, `"sequence"`, etc. |
| `diagramCode` | String | 1GB | **CANONICAL** diagram code (populates from mermaidCode/d3Code/diagramSvg) |
| `outputFormat` | String | 20 | Output format: `"mermaid"`, `"svg"`, `"d3"` |
| `sqlSchema` | String | 1GB | SQL schema (if applicable) |
| `prismaSchema` | String | 1GB | Prisma schema (if applicable) |

### Optional Fields - Metadata
| Field | Type | Size | Description |
|-------|------|------|-------------|
| `description` | String | 2000 | Detailed description |
| `parentArtifactId` | String | 100 | ID of parent artifact for versioning |
| `isPublic` | Boolean | - | Public access flag (default: `true`) |

### System Fields
| Field | Type | Description |
|-------|------|-------------|
| `$id` | String | Auto-generated document ID |
| `$createdAt` | DateTime | Auto-generated creation timestamp |
| `$updatedAt` | DateTime | Auto-generated update timestamp |

## Important Notes

### Mermaid-Only Format
- **All diagrams must be in Mermaid format**
- The system only stores `diagramCode` with complete Mermaid syntax
- `outputFormat` is always `"mermaid"` (hardcoded)
- No other formats (SVG, D3, PlantUML) are supported

### What NOT to Send
The following fields are NOT accepted and will cause validation errors:
- `mermaidCode` - Use `diagramCode` with Mermaid syntax
- `d3Code` - Not supported
- `diagramSvg` - Not supported
- `typeormEntities` - Not supported
- `notes` - Not supported
- `outputFormat` - Auto-set to `"mermaid"`

### LLM Behavior
The LLM is instructed to:
- Generate **Mermaid diagrams only**
- Always populate `diagramCode` with complete Mermaid syntax
- Include `sqlSchema` and `prismaSchema` when relevant (for ERDs)
- Never attempt to generate other formats

## Example Documents

### MVP Artifact
```json
{
  "artifactId": "mvp-123",
  "threadId": "thread-456",
  "messageId": "msg-789",
  "userId": "user-abc",
  "type": "mvp",
  "title": "Todo App",
  "description": "A simple todo application",
  "htmlCode": "<!DOCTYPE html>...",
  "cssCode": "body { ... }",
  "jsCode": "const todos = [];...",
  "framework": "vanilla",
  "theme": "light",
  "version": 1,
  "isPublic": false,
  "$createdAt": "2025-10-16T10:00:00Z",
  "$updatedAt": "2025-10-16T10:00:00Z"
}
```

### Diagram Artifact (Mermaid Format)
```json
{
  "artifactId": "diag-456",
  "threadId": "thread-789",
  "messageId": "msg-abc",
  "userId": "user-def",
  "type": "diagram",
  "title": "Database ERD",
  "description": "Entity Relationship Diagram for user orders system",
  "diagramType": "erd",
  "diagramCode": "erDiagram\n  USERS ||--o{ ORDERS : places\n  ORDERS ||--|{ ITEMS : contains",
  "outputFormat": "mermaid",
  "sqlSchema": "CREATE TABLE USERS (\n  id INT PRIMARY KEY,\n  name VARCHAR(255)\n);\nCREATE TABLE ORDERS (\n  id INT PRIMARY KEY,\n  user_id INT REFERENCES USERS(id)\n);",
  "prismaSchema": "model User {\n  id Int @id @default(autoincrement())\n  orders Order[]\n}\n\nmodel Order {\n  id Int @id @default(autoincrement())\n  userId Int\n  user User @relation(fields: [userId], references: [id])\n}",
  "version": 1,
  "isPublic": false,
  "$createdAt": "2025-10-16T10:30:00Z",
  "$updatedAt": "2025-10-16T10:30:00Z"
}
```
