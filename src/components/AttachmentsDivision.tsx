import React, { useRef, useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Paperclip,
  Download,
  Eye,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { EmailAttachment } from '../types';

interface AttachmentsDivisionProps {
  resume: EmailAttachment | null;
  transcript: EmailAttachment | null;
  onUpdateResume: (attachment: EmailAttachment | null) => void;
  onUpdateTranscript: (attachment: EmailAttachment | null) => void;
}

export const AttachmentsDivision: React.FC<AttachmentsDivisionProps> = ({
  resume,
  transcript,
  onUpdateResume,
  onUpdateTranscript,
}) => {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isTranscriptDragging, setIsTranscriptDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Convert File to base64
  const processFile = (file: File, type: 'resume' | 'transcript') => {
    setErrorMsg(null);

    // Resume must be PDF
    if (type === 'resume' && !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Resume must be a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15 MB limit. Please compress the file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes('base64,') ? result.split('base64,')[1] : result;

      const attachment: EmailAttachment = {
        id: `att-${Date.now()}-${type}`,
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type || (type === 'resume' ? 'application/pdf' : 'application/octet-stream'),
        base64Data,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (type === 'resume') {
        onUpdateResume(attachment);
      } else {
        onUpdateTranscript(attachment);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag handlers for Resume
  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsResumeDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'resume');
    }
  };

  // Drag handlers for Transcript
  const handleTranscriptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTranscriptDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'transcript');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Paperclip className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm">Campaign Attachments & Credentials</h3>
              {resume ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Resume Attached</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Resume Missing (Required)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploading your <strong className="text-slate-700">Resume PDF is mandatory</strong> for sending; <strong className="text-slate-700">Academic Transcript is optional</strong>.
            </p>
          </div>
        </div>

        {/* Global validation status banner */}
        {!resume && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-medium">Resume PDF is mandatory before sending</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Grid of Two Upload Boxes: Resume (Mandatory) & Transcript (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Resume PDF (Mandatory) */}
        <div
          className={`rounded-xl border-2 transition-all p-4 flex flex-col justify-between ${
            resume
              ? 'border-emerald-300 bg-emerald-50/30'
              : isResumeDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-dashed border-red-300 bg-red-50/10 hover:border-red-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsResumeDragging(true);
          }}
          onDragLeave={() => setIsResumeDragging(false)}
          onDrop={handleResumeDrop}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-red-600" />
                <span className="font-bold text-xs text-slate-900">Resume Document</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wide">
                  * Mandatory
                </span>
              </div>
              {resume ? (
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attached</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Required</span>
                </span>
              )}
            </div>

            {resume ? (
              <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2 mt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      PDF
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate" title={resume.name}>
                        {resume.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatSize(resume.size)} • Uploaded {resume.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateResume(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Remove Resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 px-2">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">
                  Drag & drop your <strong className="text-red-600">Resume PDF</strong> here
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF up to 15MB</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <input
              type="file"
              ref={resumeInputRef}
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0], 'resume');
                }
              }}
            />
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors text-center shadow-2xs"
              >
                {resume ? 'Replace Resume PDF' : 'Upload Resume PDF'}
              </button>
              {!resume && (
                <button
                  type="button"
                  onClick={() => {
                    // Standard minimal valid PDF sample
                    const samplePdfBase64 = 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFsgNSAwIFIgXQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA2IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA3IDAgUgo+Pgo+Pgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNzIgNzIwIFRECihoZWxsbyB3b3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago3IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE2MSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAxMTYgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA4Ci9Sb290IDMgMCBSCj4+CnN0YXJ0eHJlZgoyODIKJSVFT0YK';
                    onUpdateResume({
                      id: `sample-resume-${Date.now()}`,
                      type: 'resume',
                      name: 'Alex_Chen_Software_Engineer_Resume.pdf',
                      size: 245760,
                      mimeType: 'application/pdf',
                      base64Data: samplePdfBase64,
                      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    });
                  }}
                  className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors whitespace-nowrap"
                  title="Load sample engineering resume PDF for testing"
                >
                  Use Sample PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Box 2: Academic Transcript (Optional) */}
        <div
          className={`rounded-xl border-2 transition-all p-4 flex flex-col justify-between ${
            transcript
              ? 'border-indigo-300 bg-indigo-50/30'
              : isTranscriptDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-dashed border-slate-300 bg-slate-50/40 hover:border-slate-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsTranscriptDragging(true);
          }}
          onDragLeave={() => setIsTranscriptDragging(false)}
          onDrop={handleTranscriptDrop}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-slate-900">Academic Transcript</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                  Optional
                </span>
              </div>
              {transcript ? (
                <span className="text-[11px] font-semibold text-indigo-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attached</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Not attached</span>
              )}
            </div>

            {transcript ? (
              <div className="bg-white border border-indigo-200 rounded-lg p-3 space-y-2 mt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      DOC
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate" title={transcript.name}>
                        {transcript.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatSize(transcript.size)} • Uploaded {transcript.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateTranscript(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Remove Transcript"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 px-2">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-slate-700">
                  Drag & drop your <strong className="text-slate-800">Transcript</strong> (optional)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF or DOCX up to 15MB</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <input
              type="file"
              ref={transcriptInputRef}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0], 'transcript');
                }
              }}
            />
            <button
              type="button"
              onClick={() => transcriptInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors text-center shadow-2xs"
            >
              {transcript ? 'Replace Transcript' : 'Select Transcript File (Optional)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
