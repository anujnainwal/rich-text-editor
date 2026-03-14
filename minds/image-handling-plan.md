# Image Handling Strategy

## Core Principles
1. **Privacy First**: Prevent accidental EXIF/metadata leaks by avoiding base64 encoding where possible.
2. **Performance Optimization**: Keep the editor's generated HTML lean and the database small by utilizing client-side compression.
3. **Flexible Architecture**: Support both enterprise-grade custom server endpoints and a robust zero-backend fallback.
4. **Clean Code**: Gracefully handle edge cases, such as users removing images or pressing Undo (`Ctrl+Z`).
5. **Enforced Limits**: Protect bandwidth and UX by strictly enforcing maximum upload size limits.

## Frontend Pre-Processing (Applied to Both Approaches)
Before an image is ever sent over the network (to either a custom backend or Cloudinary), the editor must optimize it in the browser:

### 1. Client-Side Compression & Resizing
*   **The Problem:** Users frequently upload 12MB photos straight from their phones.
*   **The Solution:** Intercept the file and draw it onto a hidden HTML5 `<canvas>`. Export the canvas using `.toDataURL('image/jpeg', 0.8)` or the newer `createImageBitmap()` API.
*   **The Result:** A 12MB image is instantly compressed to ~300KB in the browser *before upload*, while visually maintaining near-identical quality for web viewing.

### 2. Strict Upload Size Limits
*   **The Rule:** The editor configuration will include a `maxImageSizeMB` property (e.g., defaulted to 5MB).
*   **The Enforcement:** Upon drop/paste, check `file.size`. If it exceeds the limit (even after attempted client-side compression), reject the upload immediately and display a clean error notification to the user (e.g., "Image exceeds the 5MB limit").

---

## 1. The Primary Approach (Custom Server Endpoints)

This is the recommended approach for production applications requiring complete control over storage, security, and the image lifecycle.

### The Flow:
1. **Upload**: User drags/drops or pastes an image.
2. **Pre-Process**: Editor validates file size limits and compresses the image via Canvas API.
3. **Transport**: The compressed image is sent to the developer's provided backend upload endpoint (`config.imageEndpoints.upload`).
4. **Insertion**: The backend responds with a public URL and a unique ID. The editor inserts an `<img src="..." data-image-id="...">` element into the DOM.
5. **Deletion (Client-Side Trigger)**: A `MutationObserver` watches the editor content. If an `<img>` tag is removed (e.g., via backspace), the editor waits briefly (to allow for 'Undo'), then sends a delete request to `config.imageEndpoints.delete`.

### Backend Responsibilities (Developer Side):
*   **Sanitization**: Utilize libraries like `sharp` (Node.js) to explicitly strip all metadata (EXIF/GPS) from the uploaded file buffer *before* saving it.
*   **Final Optimization**: Convert images to modern formats (e.g., WebP).
*   **Storage**: Save the sanitized image to permanent storage (S3, R2, etc.).
*   **Orphan Management (Recommended)**: Implement a "Garbage Collection" cron job. Periodically parse saved HTML content and delete any images stored on the server that are no longer referenced in the database.

---

## 2. The Fallback Approach (Cloudinary Unsigned Uploads)

To provide a fully functional, highly optimized experience when a custom backend is not available, the editor defaults to using Cloudinary.

### The Configuration:
The developer provides their Cloudinary `cloudName` and an `uploadPreset` string in the editor's configuration.

### Cloudinary Dashboard Prerequisites (Crucial for Security):
To prevent malicious abuse of the publicly visible `uploadPreset`, the developer *must* configure the preset within their Cloudinary dashboard with strict rules:
1.  **Signing Mode**: Must be set to `Unsigned`.
2.  **Allowed Formats**: Restrict to safe web images only (e.g., `jpg`, `png`, `webp`, `gif`).
3.  **Incoming Transformations**: Force hard limits on width/height and mandate server-side quality reduction (`Format: auto`, `Quality: auto`) as a second layer of defense behind the client-side compression.
4.  **Folder Isolation**: Route all uploads from this preset to a specific folder (e.g., `/editor-fallbacks`) for easy monitoring and bulk deletion.

### The Flow (Frontend):
1. **Upload**: User drops/pastes an image.
2. **Pre-Process**: Editor validates file size limits and compresses the image via Canvas API.
3. **Transport**: The editor sends the *compressed* file directly to Cloudinary's public unsigned upload API.
4. **Insertion**: Cloudinary returns a secure HTTPS URL. The editor inserts the `<img>` tag.
5. **Deletion**: Deletion via the frontend is intentionally **disabled**. Unsigned presets cannot perform destructive actions. Orphaned images remain in Cloudinary and must be managed via Cloudinary's dashboard (e.g., auto-delete lifecycle rules).
