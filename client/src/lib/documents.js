export const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;

const toBaseName = (fileName = "") =>
  fileName.replace(/\.[^/.]+$/, "").trim();

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the selected file."));

    reader.readAsDataURL(file);
  });

export const buildUploadedDocument = async (file, customName = "") => {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("File size must be 2 MB or smaller.");
  }

  const fileUrl = await readFileAsDataUrl(file);

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `doc-${Date.now()}`,
    name: customName.trim() || toBaseName(file.name) || "Uploaded Document",
    fileUrl,
    storageType: "upload",
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size || 0,
    uploadedAt: new Date().toISOString(),
  };
};

export const createLinkDocument = (document = {}) => ({
  id:
    document.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `doc-${Date.now()}`),
  name: document.name || "",
  fileUrl: document.fileUrl || "",
  storageType: document.storageType || "link",
  fileName: document.fileName || "",
  fileType: document.fileType || "",
  fileSize: document.fileSize || 0,
  uploadedAt: document.uploadedAt || "",
});

export const formatFileSize = (bytes = 0) => {
  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const sanitizeDocumentFileName = (name = "document") =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "") || "document";

const getExtensionFromType = (fileType = "") => {
  if (fileType.includes("pdf")) return ".pdf";
  if (fileType.includes("png")) return ".png";
  if (fileType.includes("jpeg")) return ".jpg";
  if (fileType.includes("jpg")) return ".jpg";
  if (fileType.includes("plain")) return ".txt";
  if (fileType.includes("word")) return ".docx";
  return "";
};

export const getDocumentDownloadName = (file = {}) => {
  if (file.fileName) {
    return sanitizeDocumentFileName(file.fileName);
  }

  const baseName = sanitizeDocumentFileName(file.name || "case-document");
  const extension = getExtensionFromType(file.fileType);

  return `${baseName}${extension}`;
};
