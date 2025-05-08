
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export const FileUploader = ({ onUpload, disabled = false }: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      // Clear the input value
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative">
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept=".csv"
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor="file-upload"
          className={`flex items-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose CSV File
        </label>
      </div>
      
      <div className="flex gap-2">
        {selectedFile && (
          <div className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-muted truncate max-w-[200px]">
            {selectedFile.name}
          </div>
        )}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || disabled}
          className="whitespace-nowrap"
        >
          Upload Leads
        </Button>
      </div>
    </div>
  );
};
