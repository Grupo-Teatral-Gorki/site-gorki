import React, { useRef, useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  fileName: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  folder,
  fileName,
}) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    onChange(url);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="px-2 py-1 bg-blue-600 text-white rounded"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Enviando..." : value ? "Trocar Imagem" : "Enviar Imagem"}
      </button>
      {value && (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt="Preview"
            className="w-16 h-16 object-cover rounded border"
            onError={(e) => {
              // If image fails to load, show a placeholder
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
