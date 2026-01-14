import { Attachment } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const processFiles = async (files: FileList | null): Promise<Attachment[]> => {
  if (!files) return [];
  
  const attachments: Attachment[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const base64Data = await fileToBase64(file);
      attachments.push({
        name: file.name,
        mimeType: file.type,
        data: base64Data
      });
    } catch (e) {
      console.error(`Failed to process file ${file.name}`, e);
    }
  }
  
  return attachments;
};