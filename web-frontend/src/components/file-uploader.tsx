'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { useForm } from 'react-hook-form';

// Size threshold for S3 upload in bytes (100MB)
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

type RhinoVersion = '2' | '3' | '4' | '5' | '6' | '7';

interface FormValues {
  targetVersion: RhinoVersion;
}

interface PresignedData {
  url: string;
  fields: Record<string, string>;
  key: string;
  bucket: string;
  maxMb: number;
  expiresIn: number;
}

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [bytesSent, setBytesSent] = useState(0);
  const [speedBps, setSpeedBps] = useState(0); // bytes per second
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const [isS3Upload, setIsS3Upload] = useState(false);
  const [s3UploadStage, setS3UploadStage] = useState<'presigning' | 's3uploading' | 'converting' | null>(null);

  const converterUrl = useMemo(() =>
    process.env.NEXT_PUBLIC_CONVERTER_API_URL?.replace(/\/$/, '') || '',
  []);

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
      
      // Reset S3 upload state
      setIsS3Upload(selectedFile.size > LARGE_FILE_THRESHOLD);
      setS3UploadStage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.3dm'],
    },
    maxFiles: 1,
  });

  // Get presigned URL for S3 upload
  const getPresignedUrl = async (filename: string): Promise<PresignedData> => {
    setS3UploadStage('presigning');
    const apiUrl = converterUrl ? `${converterUrl}/presign` : '/api/presign';
    const response = await fetch(`${apiUrl}?filename=${encodeURIComponent(filename)}`);
    
    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }
    
    return await response.json();
  };

  // Upload file directly to S3 using presigned URL
  const uploadToS3 = async (presignedData: PresignedData, fileToUpload: File): Promise<string> => {
    setS3UploadStage('s3uploading');
    const { url, fields, key } = presignedData;
    
    const formData = new FormData();
    // Add all fields from presigned URL
    Object.entries(fields).forEach(([fieldName, fieldValue]) => {
      formData.append(fieldName, fieldValue);
    });
    // Add the file last
    formData.append('file', fileToUpload);
    
    const startTs = Date.now();
    
    // Use XHR for upload progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setProgress(pct);
        setBytesSent(evt.loaded);
        const elapsed = (Date.now() - startTs) / 1000;
        if (elapsed > 0) {
          const bps = evt.loaded / elapsed;
          setSpeedBps(bps);
          const remaining = evt.total - evt.loaded;
          setEtaSec(bps > 0 ? Math.max(0, Math.round(remaining / bps)) : null);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during S3 upload'));
      xhr.send(formData);
    });
    
    return key;
  };

  // Convert file by S3 key
  const convertByKey = async (key: string, targetVersion: string, originalFilename: string): Promise<Blob> => {
    setS3UploadStage('converting');
    setProgress(0); // Reset progress for conversion phase
    
    const apiUrl = converterUrl ? `${converterUrl}/convert-by-key` : '/api/convert-by-key';
    const formData = new FormData();
    formData.append('key', key);
    formData.append('targetVersion', targetVersion);
    formData.append('originalFilename', originalFilename);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let msg = 'Conversion failed';
      try { msg = (await response.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    
    return await response.blob();
  };

  const handleConvert = async (values: FormValues) => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setBytesSent(0);
    setSpeedBps(0);
    setEtaSec(null);
    
    try {
      toast.info(`Converting ${file.name} to Rhino ${values.targetVersion}...`);
      
      let blob: Blob;
      
      // Use S3 flow for large files
      if (file.size > LARGE_FILE_THRESHOLD) {
        toast.info('Large file detected. Using S3 upload flow...');
        
        // Step 1: Get presigned URL
        const presignedData = await getPresignedUrl(file.name);
        
        // Step 2: Upload to S3
        const key = await uploadToS3(presignedData, file);
        toast.success('File uploaded to S3 successfully');
        
        // Step 3: Convert by key
        blob = await convertByKey(key, values.targetVersion, file.name);
      } else {
        // Direct upload for smaller files (existing code)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetVersion', values.targetVersion);
        const startTs = Date.now();

        // Prefer direct upload to microservice if env URL exists, else fallback to proxy
        let response: Response;
        if (converterUrl) {
          // Use XHR for upload progress
          const xhrResponse = await new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${converterUrl}/convert`);
            xhr.responseType = 'blob';
            xhr.upload.onprogress = (evt) => {
              if (!evt.lengthComputable) return;
              const pct = Math.round((evt.loaded / evt.total) * 100);
              setProgress(pct);
              setBytesSent(evt.loaded);
              const elapsed = (Date.now() - startTs) / 1000;
              if (elapsed > 0) {
                const bps = evt.loaded / elapsed;
                setSpeedBps(bps);
                const remaining = evt.total - evt.loaded;
                setEtaSec(bps > 0 ? Math.max(0, Math.round(remaining / bps)) : null);
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
              } else {
                reject(new Error(`Upstream error ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
          });
          response = new Response(xhrResponse);
        } else {
          response = await fetch('/api/convert', { method: 'POST', body: formData });
        }

        if (!response.ok) {
          let msg = 'Conversion failed';
          try { msg = (await response.json()).error || msg; } catch {}
          throw new Error(msg);
        }
        
        // Get the file blob from the response
        blob = await response.blob();
      }
      
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
      setS3UploadStage(null);
      setTimeout(() => {
        setProgress(0);
        setBytesSent(0);
        setSpeedBps(0);
        setEtaSec(null);
      }, 800);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setIsS3Upload(false);
    setS3UploadStage(null);
  };

  const humanSpeed = useMemo(() => {
    if (!speedBps) return '—';
    const kb = speedBps / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;
    if (gb >= 1) return `${gb.toFixed(1)} GB/s`;
    if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
    if (kb >= 1) return `${kb.toFixed(0)} kB/s`;
    return `${speedBps.toFixed(0)} B/s`;
  }, [speedBps]);

  const humanEta = useMemo(() => {
    if (etaSec == null) return '—';
    const m = Math.floor(etaSec / 60);
    const s = etaSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }, [etaSec]);

  // Get status message based on current stage
  const getStatusMessage = () => {
    if (!isConverting) return null;
    if (!isS3Upload) return "Converting...";
    
    switch (s3UploadStage) {
      case 'presigning': return "Preparing S3 upload...";
      case 's3uploading': return "Uploading to S3...";
      case 'converting': return "Converting file...";
      default: return "Processing...";
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`rounded-md p-6 text-center cursor-pointer transition-colors duration-200 border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 ${isDragActive ? 'ring-1 ring-white/40' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-base font-medium text-primary">Drop the file here...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-10 h-10 text-muted-foreground/70"
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
            <p className="text-base font-medium tracking-wide">Drag & drop your .3dm file here, or click to select</p>
            <p className="text-xs text-muted-foreground">Only .3dm files are supported</p>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-6 p-6 border border-white/20 rounded-md bg-white/5 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-center text-center">
            {/* Left: file + speed */}
            <div className="flex items-center justify-center gap-3">
              <div>
                <p className="text-sm font-medium tracking-widest">{file.name}</p>
                <p className="text-xs text-white/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                {isS3Upload && !isConverting && (
                  <p className="text-xs mt-1 text-amber-300">Large file - will use S3 upload</p>
                )}
                <p className="text-xs mt-1"><span className="text-white/60">TRANSFER SPEED</span> <span className="text-white">{humanSpeed}</span></p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  className="mt-2 border-white/20 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/40 transition-colors"
                >Remove</Button>
              </div>
            </div>
            {/* Middle: data volume bar */}
            <div>
              <div className="text-xs text-white/70 mb-2 tracking-widest">DATA VOLUME</div>
              <div className="h-6 border border-white/30 grid grid-cols-24 gap-[2px] p-[2px] bg-white/5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`h-full ${progress >= ((i + 1) / 24) * 100 ? 'bg-white' : 'bg-white/10'}`}></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-white/80 mt-2">
                <span>{(bytesSent / 1024 / 1024).toFixed(2)} MB</span>
                <span>OF {(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="text-xs text-white/70 mt-1 tracking-widest">
                {isConverting && s3UploadStage && (
                  <span className="text-amber-300 uppercase">{getStatusMessage()} </span>
                )}
                OVERALL PROGRESS {progress}%
              </div>
            </div>
            {/* Right: ETA + actions */}
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white/60">EST. TIME</div>
                <div className="text-lg font-semibold tracking-wide">{humanEta}</div>
                <div className="text-xs text-white/60">LESS THAN 15 MIN.</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button type="button" variant="outline" disabled={!isConverting}
                        className="justify-center border-white/40 text-white hover:bg-white/10 text-sm py-2 w-[80%] mx-auto">PAUSE</Button>
                <Button type="button" variant="outline" onClick={handleRemoveFile}
                        className="justify-center border-white/40 text-white hover:bg-white/10 text-sm py-2 w-[80%] mx-auto">CANCEL</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleConvert)} className="space-y-4 text-center">
          <FormField
            control={form.control}
            name="targetVersion"
            render={({ field }) => (
              <div className="mt-6 flex w-full justify-center">
                <div className="space-y-2 text-center">
                  <FormLabel htmlFor="targetVersion" className="text-xs font-medium tracking-wide block">Target Rhino Version</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!file || isConverting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm w-40 mx-auto border border-white/20 bg-white/10 backdrop-blur-sm text-white shadow-sm hover:bg-white/15">
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border border-white/20 bg-white/10 backdrop-blur-sm text-white shadow-lg">
                      <SelectItem value="7" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 7</SelectItem>
                      <SelectItem value="6" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 6</SelectItem>
                      <SelectItem value="5" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 5</SelectItem>
                      <SelectItem value="4" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 4</SelectItem>
                      <SelectItem value="3" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 3</SelectItem>
                      <SelectItem value="2" className="text-sm data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/20">Rhino 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full md:w-auto mt-2 transition-all duration-200 bg-primary/90 hover:bg-primary text-sm px-4 py-2" 
            disabled={isConverting || !file}
          >
            {isConverting ? getStatusMessage() || 'Converting...' : 'Convert and Download'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
