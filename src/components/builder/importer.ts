import JSZip from "jszip";
import { type BNode, type NodeType, uid, toHTML } from "./types";

export function countNodes(node: BNode): number {
  let count = 1;
  for (const child of node.children ?? []) {
    count += countNodes(child);
  }
  return count;
}

export function parseInlineStyle(styleAttr: string | null): Record<string, string> {
  const style: Record<string, string> = {};
  if (!styleAttr) return style;
  const rules = styleAttr.split(";");
  for (const rule of rules) {
    const idx = rule.indexOf(":");
    if (idx !== -1) {
      const prop = rule.slice(0, idx).trim();
      const val = rule.slice(idx + 1).trim();
      if (prop && val) {
        const camel = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        style[camel] = val;
      }
    }
  }
  return style;
}

function resolveAssetSrc(rawSrc: string, assetMap?: Record<string, string>): string {
  if (!rawSrc) return "";
  if (rawSrc.startsWith("http://") || rawSrc.startsWith("https://") || rawSrc.startsWith("data:") || rawSrc.startsWith("//")) {
    return rawSrc;
  }
  if (!assetMap) return rawSrc;

  if (assetMap[rawSrc]) return assetMap[rawSrc];

  const cleanPath = rawSrc.replace(/^\.\//, "").replace(/^\//, "");
  if (assetMap[cleanPath]) return assetMap[cleanPath];

  const baseName = rawSrc.split("/").pop()?.split("?")[0]?.split("#")[0];
  if (baseName && assetMap[baseName]) return assetMap[baseName];

  return rawSrc;
}

function domNodeToBNode(el: HTMLElement, assetMap?: Record<string, string>): BNode | null {
  const tagName = el.tagName.toUpperCase();
  const inlineStyle = parseInlineStyle(el.getAttribute("style"));
  const className = el.getAttribute("class") || el.className || "";

  // Skip metadata or invisible script elements
  if (["SCRIPT", "STYLE", "NOSCRIPT", "META", "LINK"].includes(tagName)) {
    return null;
  }

  // Preserve SVGs as custom embeds so icons/logos are not stripped
  if (tagName === "SVG") {
    return {
      id: el.id || uid(),
      type: "customEmbed",
      text: "SVG Vector Graphic",
      embedCode: el.outerHTML,
      className,
      style: {
        display: inlineStyle.display || "inline-block",
        maxWidth: inlineStyle.maxWidth || "100%",
        ...inlineStyle,
      },
    };
  }

  // Preserve IFRAMEs
  if (tagName === "IFRAME") {
    return {
      id: el.id || uid(),
      type: "customEmbed",
      text: "Embedded Frame",
      embedCode: el.outerHTML,
      className,
      style: {
        width: inlineStyle.width || "100%",
        border: "none",
        ...inlineStyle,
      },
    };
  }

  // Heading tags H1 - H6
  if (/^H[1-6]$/.test(tagName)) {
    const level = parseInt(tagName.charAt(1), 10);
    const text = el.innerText?.trim() || el.textContent?.trim() || `Heading ${level}`;
    return {
      id: el.id || uid(),
      type: "heading",
      level,
      text,
      className,
      style: {
        fontSize: level === 1 ? "48px" : level === 2 ? "36px" : level === 3 ? "28px" : "20px",
        fontWeight: "700",
        color: inlineStyle.color || "inherit",
        margin: inlineStyle.margin || "0",
        ...inlineStyle,
      },
    };
  }

  // Paragraph, span, small text, labels, list items
  if (["P", "SPAN", "LABEL", "SMALL", "B", "STRONG", "EM", "I", "BLOCKQUOTE", "LI"].includes(tagName)) {
    if (!el.querySelector("div, section, p, h1, h2, h3, h4, h5, h6, img, ul, ol, table, form")) {
      const text = el.innerText?.trim() || el.textContent?.trim() || "";
      if (!text) return null;
      return {
        id: el.id || uid(),
        type: "text",
        text,
        className,
        style: {
          fontSize: tagName === "SMALL" ? "13px" : inlineStyle.fontSize || "16px",
          color: inlineStyle.color || "inherit",
          lineHeight: inlineStyle.lineHeight || "1.6",
          margin: inlineStyle.margin || "0",
          ...inlineStyle,
        },
      };
    }
  }

  // Button or Anchor Link
  if (tagName === "BUTTON" || tagName === "A") {
    const href = el.getAttribute("href") || "#";
    const text = el.innerText?.trim() || el.textContent?.trim() || "Click here";
    return {
      id: el.id || uid(),
      type: "button",
      text,
      href,
      className,
      style: {
        background: inlineStyle.background || inlineStyle.backgroundColor || "#c2410c",
        color: inlineStyle.color || "#ffffff",
        padding: inlineStyle.padding || "12px 28px",
        borderRadius: inlineStyle.borderRadius || "999px",
        fontSize: inlineStyle.fontSize || "16px",
        fontWeight: inlineStyle.fontWeight || "600",
        display: inlineStyle.display || "inline-block",
        textDecoration: inlineStyle.textDecoration || "none",
        ...inlineStyle,
      },
    };
  }

  // Image tag
  if (tagName === "IMG") {
    const rawSrc = el.getAttribute("src") || "";
    const resolved = resolveAssetSrc(rawSrc, assetMap);
    return {
      id: el.id || uid(),
      type: "image",
      src: resolved,
      className,
      style: {
        width: inlineStyle.width || "100%",
        maxWidth: inlineStyle.maxWidth || "100%",
        borderRadius: inlineStyle.borderRadius || "8px",
        display: inlineStyle.display || "block",
        ...inlineStyle,
      },
    };
  }

  // Horizontal divider
  if (tagName === "HR") {
    return {
      id: el.id || uid(),
      type: "divider",
      className,
      style: {
        width: "100%",
        height: "1px",
        background: inlineStyle.background || "#d6d3d1",
        border: "none",
        margin: inlineStyle.margin || "16px 0",
        ...inlineStyle,
      },
    };
  }

  // Containers and Sections
  const isSectionTag = ["SECTION", "HEADER", "FOOTER", "NAV", "MAIN", "ARTICLE"].includes(tagName);
  const nodeType: NodeType = isSectionTag ? "section" : "container";

  const children: BNode[] = [];

  for (const childNode of Array.from(el.childNodes)) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      const txt = childNode.textContent?.trim();
      if (txt && txt.length > 0) {
        children.push({
          id: uid(),
          type: "text",
          text: txt,
          style: {
            fontSize: "16px",
            color: "inherit",
            lineHeight: "1.6",
            margin: "0",
          },
        });
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      const bnode = domNodeToBNode(childNode as HTMLElement, assetMap);
      if (bnode) {
        children.push(bnode);
      }
    }
  }

  // Clean layout that respects the website's CSS classes
  const defaultStyle: Record<string, string> = isSectionTag
    ? {
        width: "100%",
        padding: inlineStyle.padding || (tagName === "SECTION" ? "48px 24px" : "0"),
      }
    : {
        width: inlineStyle.width || "100%",
      };

  return {
    id: el.id || uid(),
    type: nodeType,
    className,
    style: {
      ...defaultStyle,
      ...inlineStyle,
    },
    children,
  };
}

export function extractStylesFromHtml(htmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const styles: string[] = [];
  doc.querySelectorAll("style").forEach((styleEl) => {
    if (styleEl.textContent?.trim()) {
      styles.push(styleEl.textContent.trim());
    }
  });
  return styles.join("\n\n");
}

export function convertJsxToHtml(code: string): string {
  try {
    const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*(?:\}|(?=\n\s*(?:export|function|const)))/);
    let jsx = returnMatch ? returnMatch[1] : "";
    if (!jsx) {
      const singleMatch = code.match(/return\s+(<[\s\S]*?>);?/);
      if (singleMatch) jsx = singleMatch[1];
    }
    if (!jsx) return "";

    // Remove comments
    jsx = jsx.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

    // Convert className to class
    jsx = jsx.replace(/className=(?:\{`([^`]+)`\}|"([^"]+)"|'([^']+)')/g, (_, g1, g2, g3) => {
      const val = g1 || g2 || g3 || "";
      return `class="${val}"`;
    });

    // Replace self-closing icon or component tags like <Sparkles ... /> with empty span
    jsx = jsx.replace(/<([A-Z][a-zA-Z0-9]+)\s+[^>]*\/>/g, '<span class="icon"></span>');

    // Clean simple string expressions { "text" }
    jsx = jsx.replace(/\{["']([^"']+)["']\}/g, "$1");

    return jsx.trim();
  } catch {
    return "";
  }
}

export function buildSelfContainedHtml(
  htmlContent: string,
  cssFiles: Record<string, string>,
  assetMap: Record<string, string>
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // CRITICAL: Strip all script tags so no host code or external loops run inside preview
  doc.querySelectorAll("script").forEach((s) => s.remove());

  // 1. Inlined <link rel="stylesheet"> with extracted CSS
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      const cleanHref = href.replace(/^\.\//, "").replace(/^\//, "");
      const baseCssName = cleanHref.split("/").pop() || "";
      const matchedCss =
        cssFiles[href] ||
        cssFiles[cleanHref] ||
        cssFiles[baseCssName] ||
        Object.entries(cssFiles).find(([p]) => p.endsWith(baseCssName))?.[1];

      if (matchedCss) {
        const styleEl = doc.createElement("style");
        styleEl.textContent = `/* Inlined from ${href} */\n${matchedCss}`;
        link.parentNode?.replaceChild(styleEl, link);
      }
    }
  });

  // 2. Append all remaining CSS files in <head>
  const allCss = Object.values(cssFiles).join("\n\n");
  if (allCss) {
    const extraStyle = doc.createElement("style");
    extraStyle.textContent = `/* Inlined Bundle CSS */\n${allCss}`;
    doc.head.appendChild(extraStyle);
  }

  // 3. Resolve all image src attributes to base64 data URIs
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src) {
      const resolved = resolveAssetSrc(src, assetMap);
      if (resolved && resolved !== src) {
        img.setAttribute("src", resolved);
      }
    }
  });

  // 4. Resolve background-image: url(...) in element styles
  doc.querySelectorAll("[style*='url(']").forEach((el) => {
    let styleStr = el.getAttribute("style") || "";
    for (const [key, uri] of Object.entries(assetMap)) {
      if (styleStr.includes(key)) {
        styleStr = styleStr.split(key).join(uri);
      }
    }
    el.setAttribute("style", styleStr);
  });

  return doc.documentElement.outerHTML;
}

export function htmlToBNode(htmlString: string, assetMap?: Record<string, string>): BNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  const body = doc.body;
  const children: BNode[] = [];

  for (const childNode of Array.from(body.childNodes)) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      const txt = childNode.textContent?.trim();
      if (txt) {
        children.push({
          id: uid(),
          type: "text",
          text: txt,
          style: { fontSize: "18px", color: "#57534e", lineHeight: "1.6", margin: "0" },
        });
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      const parsed = domNodeToBNode(childNode as HTMLElement, assetMap);
      if (parsed) {
        children.push(parsed);
      }
    }
  }

  let finalChildren = children;
  if (children.length === 1 && children[0].type === "container" && (children[0].children?.length ?? 0) > 0) {
    finalChildren = children[0].children!;
  }

  return {
    id: "root",
    type: "section",
    style: {
      display: "flex",
      flexDirection: "column",
      background: "#ffffff",
      minHeight: "100%",
      width: "100%",
    },
    children: finalChildren.length > 0 ? finalChildren : [
      {
        id: uid(),
        type: "section",
        style: { padding: "64px 32px", background: "#f6f1ea", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" },
        children: [
          { id: uid(), type: "heading", level: 1, text: "Imported Website", style: { fontSize: "40px", fontWeight: "700", color: "#1c1917" } },
          { id: uid(), type: "text", text: "Start customizing your imported layout.", style: { fontSize: "18px", color: "#57534e" } }
        ]
      }
    ],
  };
}

export interface PreservedZipEntry {
  path: string;
  content: string;
  isBase64: boolean;
  category: "html" | "css" | "backend" | "asset" | "config";
}

export interface ParseResult {
  page: BNode;
  filename: string;
  elementCount: number;
  imagesCount: number;
  filesList: string[];
  fileType: "zip" | "html" | "json";
  extractedCss?: string;
  preservedEntries?: PreservedZipEntry[];
  mainHtmlPath?: string;
  mainCssPath?: string;
  backendFiles?: string[];
  fullPreviewHtml?: string;
}

function classifyFile(path: string): PreservedZipEntry["category"] {
  const lower = path.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (
    lower.endsWith(".ts") ||
    lower.endsWith(".js") ||
    lower.endsWith(".py") ||
    lower.endsWith(".php") ||
    lower.endsWith(".rb") ||
    lower.endsWith(".go") ||
    lower.endsWith(".java") ||
    lower.endsWith(".sql") ||
    lower.includes("server") ||
    lower.includes("api/") ||
    lower.includes("routes/") ||
    lower.includes("controllers/") ||
    lower.includes("models/")
  ) {
    return "backend";
  }
  if (
    lower.endsWith(".json") ||
    lower.endsWith(".env") ||
    lower.endsWith(".example") ||
    lower.endsWith(".md") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".yaml")
  ) {
    return "config";
  }
  return "asset";
}

function isTextFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return [
    "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "txt",
    "py", "php", "rb", "go", "java", "sql", "env", "example", "yml", "yaml",
    "xml", "svg", "gitignore", "sh",
  ].includes(ext);
}

export interface ZipExtractionProgress {
  stage: "reading" | "extracting" | "styling" | "converting" | "complete";
  percent: number; // 0 - 100
  message: string;
  currentFile?: string;
  processedFiles: number;
  totalFiles: number;
  imagesCount: number;
  backendCount: number;
}

export async function parseUploadedFile(
  file: File,
  onProgress?: (progress: ZipExtractionProgress) => void
): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "zip") {
    onProgress?.({
      stage: "reading",
      percent: 8,
      message: `Opening "${file.name}" & reading archive directory...`,
      processedFiles: 0,
      totalFiles: 0,
      imagesCount: 0,
      backendCount: 0,
    });

    const zip = await JSZip.loadAsync(file);
    const assetMap: Record<string, string> = {};
    const cssFiles: Record<string, string> = {};
    const filesList: string[] = [];
    const preservedEntries: PreservedZipEntry[] = [];
    const backendFiles: string[] = [];
    const cssChunks: string[] = [];

    const fileEntries: { name: string; file: JSZip.JSZipObject }[] = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && !relativePath.startsWith("__MACOSX/") && !relativePath.includes("/node_modules/") && !relativePath.startsWith("node_modules/")) {
        fileEntries.push({ name: relativePath, file: zipEntry });
        filesList.push(relativePath);
      }
    });

    const totalFiles = fileEntries.length;
    let imagesCount = 0;
    let mainCssPath: string | undefined;

    onProgress?.({
      stage: "extracting",
      percent: 18,
      message: `Found ${totalFiles} files. Starting extraction...`,
      processedFiles: 0,
      totalFiles,
      imagesCount: 0,
      backendCount: 0,
    });

    for (let i = 0; i < fileEntries.length; i++) {
      const { name, file: zipFile } = fileEntries[i];
      const fileExt = name.split(".").pop()?.toLowerCase();
      const category = classifyFile(name);
      if (category === "backend") {
        backendFiles.push(name);
      }

      if (["png", "jpg", "jpeg", "svg", "webp", "gif", "bmp", "ico"].includes(fileExt || "")) {
        const mime = fileExt === "svg" ? "image/svg+xml" : fileExt === "ico" ? "image/x-icon" : `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;
        const base64 = await zipFile.async("base64");
        const dataUri = `data:${mime};base64,${base64}`;
        assetMap[name] = dataUri;
        assetMap[name.replace(/^\.\//, "")] = dataUri;
        assetMap["/" + name] = dataUri;
        const baseOnly = name.split("/").pop();
        if (baseOnly) {
          assetMap[baseOnly] = dataUri;
        }
        imagesCount++;
        preservedEntries.push({
          path: name,
          content: base64,
          isBase64: true,
          category: "asset",
        });
      } else if (isTextFile(name)) {
        const textContent = await zipFile.async("text");
        if (category === "css") {
          if (!mainCssPath) mainCssPath = name;
          cssFiles[name] = textContent;
          const cleanName = name.replace(/^\.\//, "").replace(/^\//, "");
          cssFiles[cleanName] = textContent;
          cssChunks.push(`/* File: ${name} */\n${textContent}`);
        }
        preservedEntries.push({
          path: name,
          content: textContent,
          isBase64: false,
          category,
        });
      } else {
        const base64 = await zipFile.async("base64");
        preservedEntries.push({
          path: name,
          content: base64,
          isBase64: true,
          category,
        });
      }

      // Calculate extraction percent: from 18% to 85%
      const currentPct = Math.min(85, Math.round(18 + ((i + 1) / Math.max(1, totalFiles)) * 67));
      const shortName = name.split("/").pop() || name;
      onProgress?.({
        stage: "extracting",
        percent: currentPct,
        message: `Extracting ${shortName} (${i + 1}/${totalFiles})`,
        currentFile: name,
        processedFiles: i + 1,
        totalFiles,
        imagesCount,
        backendCount: backendFiles.length,
      });
    }

    onProgress?.({
      stage: "styling",
      percent: 88,
      message: "Processing CSS stylesheets & linking assets...",
      processedFiles: totalFiles,
      totalFiles,
      imagesCount,
      backendCount: backendFiles.length,
    });

    // Check for canvas/builder project JSON
    const jsonEntry = fileEntries.find(
      (e) =>
        e.name.endsWith(".json") &&
        (e.name.includes("canvas-project") || e.name.includes("builder-project"))
    );
    if (jsonEntry) {
      try {
        const jsonText = await jsonEntry.file.async("text");
        const parsed = JSON.parse(jsonText);
        if (parsed.id && parsed.type && parsed.style) {
          const selfHtml = `<!doctype html><html><head><meta charset="utf-8"/><style>${cssChunks.join("\n\n")}</style></head><body>${toHTML(parsed)}</body></html>`;
          return {
            page: parsed,
            filename: file.name,
            elementCount: countNodes(parsed),
            imagesCount,
            filesList,
            fileType: "zip",
            extractedCss: cssChunks.join("\n\n"),
            preservedEntries,
            mainCssPath,
            backendFiles,
            fullPreviewHtml: selfHtml,
          };
        }
      } catch {
        // proceed to HTML check
      }
    }

    // Find HTML file - sort to prioritize index.html at root, then other index.html, then any html
    const htmlEntries = fileEntries.filter((e) => {
      const lower = e.name.toLowerCase();
      return lower.endsWith(".html") || lower.endsWith(".htm");
    });

    let indexHtml = htmlEntries.find((e) => e.name.toLowerCase() === "index.html") ||
                    htmlEntries.find((e) => e.name.toLowerCase().endsWith("/index.html")) ||
                    htmlEntries[0];

    if (!indexHtml) {
      // Fallback: build a nice file structure visual page
      const fallbackHtml = `<!doctype html><html><head><meta charset="utf-8"/><title>${file.name}</title><style>body{font-family:sans-serif;padding:40px;background:#0f172a;color:#f8fafc;}h1{color:#38bdf8;}ul{line-height:2;}li{font-family:monospace;}</style></head><body><h1>📦 ${file.name}</h1><p>ZIP Archive successfully loaded (${filesList.length} files preserved).</p><h3>Files in archive:</h3><ul>${filesList.map(f => `<li>📄 ${f}</li>`).join("")}</ul></body></html>`;
      const fallbackNode = htmlToBNode(fallbackHtml, assetMap);
      return {
        page: fallbackNode,
        filename: file.name,
        elementCount: filesList.length,
        imagesCount,
        filesList,
        fileType: "zip",
        extractedCss: cssChunks.join("\n\n"),
        preservedEntries,
        mainCssPath,
        backendFiles,
        fullPreviewHtml: fallbackHtml,
      };
    }

    let htmlContent = await indexHtml.file.async("text");

    // Check if the HTML is a single-page app (React/Vue/Vite) with an empty root
    const isSpaShell =
      (htmlContent.includes('id="root"') || htmlContent.includes("id='root'")) &&
      !htmlContent.includes("<h1>") &&
      !htmlContent.includes("<section") &&
      !htmlContent.includes("<header");

    if (isSpaShell) {
      const reactAppEntry = fileEntries.find((e) => {
        const lower = e.name.toLowerCase();
        return (
          lower.endsWith("app.tsx") ||
          lower.endsWith("app.jsx") ||
          lower.endsWith("app.js")
        );
      });

      if (reactAppEntry) {
        const reactCode = await reactAppEntry.file.async("text");
        const extractedHtml = convertJsxToHtml(reactCode);
        if (extractedHtml) {
          htmlContent = htmlContent.replace(/<div id=["']root["']>[\s\S]*?<\/div>/i, `<div id="root">${extractedHtml}</div>`);
        }
      }
    }

    const inlineStyleTagCss = extractStylesFromHtml(htmlContent);
    if (inlineStyleTagCss) {
      cssChunks.unshift(`/* Inline <style> from ${indexHtml.name} */\n${inlineStyleTagCss}`);
    }

    const fullPreviewHtml = buildSelfContainedHtml(htmlContent, cssFiles, assetMap);
    const page = htmlToBNode(htmlContent, assetMap);

    onProgress?.({
      stage: "complete",
      percent: 100,
      message: `Extraction complete! Loaded ${totalFiles} files and ${imagesCount} images.`,
      processedFiles: totalFiles,
      totalFiles,
      imagesCount,
      backendCount: backendFiles.length,
    });

    return {
      page,
      filename: file.name,
      elementCount: countNodes(page),
      imagesCount,
      filesList,
      fileType: "zip",
      extractedCss: cssChunks.join("\n\n"),
      preservedEntries,
      mainHtmlPath: indexHtml.name,
      mainCssPath,
      backendFiles,
      fullPreviewHtml,
    };
  }

  if (ext === "json") {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || !parsed.type || !parsed.style) {
      throw new Error("Invalid project JSON: Must contain node type and style definitions.");
    }
    const selfHtml = `<!doctype html><html><head><meta charset="utf-8"/></head><body>${toHTML(parsed)}</body></html>`;
    return {
      page: parsed,
      filename: file.name,
      elementCount: countNodes(parsed),
      imagesCount: 0,
      filesList: [file.name],
      fileType: "json",
      fullPreviewHtml: selfHtml,
    };
  }

  if (ext === "html" || ext === "htm") {
    const htmlText = await file.text();
    const extractedCss = extractStylesFromHtml(htmlText);
    const page = htmlToBNode(htmlText);
    return {
      page,
      filename: file.name,
      elementCount: countNodes(page),
      imagesCount: 0,
      filesList: [file.name],
      fileType: "html",
      extractedCss,
      mainHtmlPath: file.name,
      fullPreviewHtml: htmlText,
    };
  }

  throw new Error("Unsupported file format. Please upload a .zip, .html, or .json file.");
}

export async function downloadZipArchive(
  entries: PreservedZipEntry[],
  filename = "extracted-archive.zip"
): Promise<void> {
  const zip = new JSZip();
  for (const entry of entries) {
    if (entry.isBase64) {
      zip.file(entry.path, entry.content, { base64: true });
    } else {
      zip.file(entry.path, entry.content);
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".zip") ? filename : `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
