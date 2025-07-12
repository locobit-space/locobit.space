// composables/useUploadToPhp.ts
export const useUpload = () => {
  const uploadEncryptedFile = async (
    file: Blob,
    filename: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, filename);

    const res = await fetch("api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      return result.url; // Publicly accessible encrypted file URL
    } else {
      throw new Error(result.error || "Upload failed.");
    }
  };

  return {
    uploadEncryptedFile,
  };
};
