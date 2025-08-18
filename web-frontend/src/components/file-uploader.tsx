'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { useForm } from 'react-hook-form';

type RhinoVersion = '2' | '3' | '4' | '5' | '6' | '7';

interface FormValues {
  targetVersion: RhinoVersion;
}

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      targetVersion: '7',
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      // Check if file is a .3dm file
      if (!selectedFile.name.toLowerCase().endsWith('.3dm')) {
        toast.error('Please upload a valid .3dm file');
        return;
      }
      
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.3dm'],
    },
    maxFiles: 1,
  });

  const handleConvert = async (values: FormValues) => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsConverting(true);
    
    try {
      toast.info(`Converting ${file.name} to Rhino ${values.targetVersion}...`);
      
      // Create form data to send to the API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetVersion', values.targetVersion);
      
      // Send the file to our API endpoint
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      // Get the file blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `${file.name.replace('.3dm', '')}_v${values.targetVersion}.3dm`;
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Conversion complete! Downloading ${filename}`);
      
    } catch (error) {
      toast.error(`Error converting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200 ${isDragActive ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-border/90'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Drop the file here...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-14 h-14 text-muted-foreground/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
            </div>
            <p className="text-lg font-medium">Drag & drop your .3dm file here, or click to select</p>
            <p className="text-sm text-muted-foreground">Only .3dm files are supported</p>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-6 p-4 border border-border/60 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-primary/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRemoveFile}
                title="Remove file"
                className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              ></Button>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleConvert)} className="space-y-4">
          <FormField
            control={form.control}
            name="targetVersion"
            render={({ field }) => (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel htmlFor="targetVersion" className="text-sm font-medium">Target Rhino Version</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!file || isConverting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">Rhino 7</SelectItem>
                      <SelectItem value="6">Rhino 6</SelectItem>
                      <SelectItem value="5">Rhino 5</SelectItem>
                      <SelectItem value="4">Rhino 4</SelectItem>
                      <SelectItem value="3">Rhino 3</SelectItem>
                      <SelectItem value="2">Rhino 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full md:w-auto mt-2 transition-all duration-200 bg-primary/90 hover:bg-primary" 
            disabled={isConverting || !file}
          >
            {isConverting ? 'Converting...' : 'Convert and Download'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
