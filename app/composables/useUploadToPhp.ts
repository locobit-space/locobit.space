// composables/useUploadToPhp.ts
export const useUploadToPhp = () => {
  const uploadEncryptedFile = async (
    file: Blob,
    filename: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, filename);

    const res = await fetch("http://localhost/customer/upload.php", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    console.log(result)
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
