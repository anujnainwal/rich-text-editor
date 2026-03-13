# InkFlow Editor: Security & Usage Guidelines (Do's and Don'ts)

As a developer or end-user utilizing the **InkFlow Editor** in your application, you must adhere to several best practices to ensure that your application remains secure and performs optimally. While the editor has built-in security features, security is a shared responsibility between the rich text editor component and the host application.

---

## ✅ The "Do's" (What to Do)

### 1. **Do Implement Backend Sanitization**
While InkFlow Editor includes robust frontend zero-trust sanitization (powered by DOMPurify), you **must** always sanitize the generated HTML on your server before saving it to a database or rendering it back to other users. Never trust client-side data blindly.

### 2. **Do Use a Content Security Policy (CSP)**
Configure a strict Content Security Policy (CSP) on your web application. A strong CSP will act as a secondary defense layer, blocking any unauthorized scripts or inline styles from executing even if an attacker discovers a zero-day bypass.
- **Example:** Restrict `default-src` to `'self'` and explicitly allow image domains.

### 3. **Do Enforce HTTPS for Embedded Media**
When developers allow users to insert images or links, ensure that those resources are served over secure `HTTPS` connections to prevent Man-in-the-Middle (MITM) attacks and mixed content warnings on your site.

### 4. **Do Keep the Library Updated**
Make sure to always update InkFlow Editor in your `package.json` to the newest stable version, as patches for newly discovered DOM vulnerabilities or specific attack vectors are actively developed and deployed.

### 5. **Do Utilize Safe Rendering Methods**
When taking the HTML string from `editor.getHTML()` and rendering it in a framework like Next.js or React, use secure sanitizing wrappers or ensure your application sanitizes the string immediately before injecting it via `dangerouslySetInnerHTML`.

---

## ❌ The "Don'ts" (What NOT to Do)

### 1. **Do Not Bypass Built-in DOMPurify Protections**
Never attempt to mock, disable, or modify the internal `DOMPurify.sanitize` methods located inside the editor’s core files (`Editor.ts`). Removing these restrictions instantly exposes your users to critical Cross-Site Scripting (XSS) injection attacks via pasted content.

### 2. **Do Not Allow Unsafe URI Schemes**
If you ever extend the editor's configuration down the line to allow programmatic linking, do not loosen the URI validation. The editor currently explicitly blocks `javascript:`, `vbscript:`, `data:`, and `file:` protocols. Re-enabling them allows attackers to trigger malicious payloads directly with a single click.

### 3. **Do Not Automatically Trust External Image URLs**
If you handle image uploads (e.g., via drag-and-drop or pasting), ensure your backend validates the uploaded file types (checking magic bytes, not just extensions) and strips EXIF metadata. Do not assume an image arraybuffer is safe simply because the frontend editor accepted the paste.

### 4. **Do Not Render Unvalidated HTML Immediately in Emails**
If your platform uses the rich text content to dispatch emails or newsletters, ensure that your mail transport pipeline heavily normalizes and sanitizes the output. Email clients handle HTML completely differently than browsers, and malicious SVGs or styles may break email clients in unexpected ways.

### 5. **Do Not Save Malformed or Partial State**
Always save the final string outputted by the `onSave` or `onChange` events, as this data signifies that normalization (ensuring tags are correctly closed and structured) has finished executing. Do not scrape raw `.innerHTML` directly from the editor's DOM node via external scripts, as it might contain temporary UI cursors or pending un-sanitized fragments.

---

## 🧪 Testing the Security Layer (Payload Examples)

You can manually verify that the InkFlow Editor's security layer (`DOMPurify`) is actively blocking threats by pasting or programmatically setting the following sample strings.

### 1. The Dangerous Text (Unsafe Payload)
This string contains multiple common Cross-Site Scripting (XSS) vectors. If you attempt to inject this via `editor.setHTML()` or by pasting it into the editor, the malicious executable parts will be silently stripped, and no alerts will fire.

```html
<!-- Attempting an inline script injection -->
<h2>Hello World</h2>
<script>alert("XSS Vulnerability found from Script Tag!");</script>

<!-- Attempting an event handler injection on an image -->
<p>Here is an image: <img src="invalid-image.jpg" onerror="alert('XSS from Image OnError!');" /></p>

<!-- Attempting a malicious URI scheme injection -->
<p>Click <a href="javascript:alert('XSS from Link Execution!')">here</a> for a surprise.</p>
```

**What happens:** 
- The `<script>` tag is **completely removed**.
- The `onerror` attribute is **stripped** from the `<img>` tag.
- The link might be neutralized by DOMPurify (depending on deep configuration) or intercepted by our custom `createLink` URI validation. 
- *Resulting HTML is safe to render.*

### 2. The Secure Text (Safe Data)
This string contains standard rich-text formatting utilizing the allowed whitelist of attributes (e.g., classes, IDs) and elements.

```html
<h2 id="welcome-heading" class="text-primary">Welcome to InkFlow Editor</h2>
<p>This is a completely safe paragraph containing <b>bold</b> and <i>italic</i> elements.</p>
<p>Check out our <a href="https://example.com" target="_blank" rel="noopener noreferrer">official website</a> for more details.</p>
<hr />
<ul>
  <li>Safe list item 1</li>
  <li>Safe list item 2</li>
</ul>
```

**What happens:** 
- The editor parses this flawlessly.
- All IDs, classes, `href` attributes, and structural elements are retained. 
- *Resulting HTML accurately reflects the structural intent.*
