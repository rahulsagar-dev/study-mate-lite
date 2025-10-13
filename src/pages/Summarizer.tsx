import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Trash2, Download, History, X, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSummaries } from '@/hooks/useSummaries';
import { supabase } from '@/integrations/supabase/client';

interface SummaryHistory {
  id: string;
  originalText: string;
  summary: string;
  type: string;
  date: Date;
  originalLength: number;
  summaryLength: number;
  fileName?: string;
  compressionRatio: number;
}

const summaryTypes = [
  { value: 'assignment', label: 'Assignment Summary (~15%)', percentage: 15 },
  { value: 'detailed', label: 'Detailed Summary (~30%)', percentage: 30 },
  { value: 'bullet', label: 'Bullet Point Summary (~20-25%)', percentage: 22.5 }
];

export default function Summarizer() {
  const [inputText, setInputText] = useState('');
  const [summaryType, setSummaryType] = useState('assignment');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { summaries, createSummary, deleteSummary } = useSummaries();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOCX, or TXT files only.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Parse the document
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
        body: { filePath }
      });

      if (parseError) throw parseError;

      if (parseData.error) {
        throw new Error(parseData.error);
      }

      setInputText(parseData.text);
      
      // Save document metadata
      await supabase.from('documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_url: filePath,
        file_type: fileExtension.replace('.', ''),
        file_size: file.size,
        extracted_text: parseData.text,
        text_length: parseData.textLength,
        word_count: parseData.wordCount,
        parsed_at: new Date().toISOString(),
        processing_status: 'success'
      });

      toast({
        title: "File Processed",
        description: `${file.name} parsed successfully. ${parseData.wordCount} words extracted.`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the uploaded file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate summaries.",
        variant: "destructive"
      });
      return;
    }

    const textToSummarize = inputText.trim();
    
    if (!textToSummarize) {
      toast({
        title: "Error",
        description: "Please enter some text or upload a file to summarize.",
        variant: "destructive"
      });
      return;
    }

    // Check if input is too short
    if (textToSummarize.length < 100) {
      toast({
        title: "Input too short",
        description: "Please provide at least 100 characters for summarization.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Call Supabase edge function for AI generation
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-summary', {
        body: { 
          input_text: textToSummarize,
          mode: summaryType
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate summary');
      }

      if (functionData.error) {
        // Handle rate limiting
        if (functionData.retryAfter) {
          toast({
            title: "Rate Limit Exceeded",
            description: `Please wait ${functionData.retryAfter} seconds before trying again.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Generation Failed",
            description: functionData.error,
            variant: "destructive"
          });
        }
        setIsGenerating(false);
        return;
      }

      const generatedSummary = functionData.summary;
      const generatedWordCount = functionData.word_count;
      const generatedCompressionRatio = functionData.compression_ratio;

      setSummary(generatedSummary);
      setWordCount(generatedWordCount);
      setCompressionRatio(generatedCompressionRatio);

      // Save to database
      const selectedType = summaryTypes.find(t => t.value === summaryType);
      await createSummary({
        title: uploadedFile?.name || `Summary - ${new Date().toLocaleDateString()}`,
        original_text: textToSummarize,
        summary_text: generatedSummary,
        summary_type: summaryType as 'assignment' | 'detailed' | 'bullet',
        word_count: generatedWordCount,
        compression_ratio: generatedCompressionRatio
      });
      
      toast({
        title: "Summary Generated",
        description: "Your summary has been created and saved successfully!",
      });
    } catch (error) {
      console.error('Summary generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard!",
    });
  };

  const handleClear = () => {
    setInputText('');
    setSummary('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const viewHistoryItem = (item: any) => {
    setInputText(item.original_text);
    setSummary(item.summary_text);
    setSummaryType(item.summary_type);
    setWordCount(item.word_count || 0);
    setCompressionRatio(item.compression_ratio || 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Summarizer
              </span>
            </h1>
            <p className="text-muted-foreground">
              Transform lengthy texts into concise, meaningful summaries
            </p>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                History ({summaries.length})
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Summary History</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {summaries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No summaries yet. Generate your first summary!
                  </p>
                ) : (
                  summaries.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {summaryTypes.find(t => t.value === item.summary_type)?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium mb-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {item.original_text}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.compression_ratio}% compressed
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewHistoryItem(item)}
                              className="h-6 px-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(item.summary_text)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSummary(item.id)}
                              className="h-6 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Input Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your text here to summarize..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px] resize-none"
                disabled={isProcessingFile}
              />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{inputText.length} characters</span>
                <span>{inputText.split(' ').filter(w => w.length > 0).length} words</span>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                OR
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Upload Document</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Supports PDF, DOCX, and TXT files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile}
                  >
                    {isProcessingFile ? 'Processing...' : 'Choose File'}
                  </Button>
                  {uploadedFile && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{inputText.length} characters</span>
                <span>{inputText.split(' ').filter(w => w.length > 0).length} words</span>
              </div>
              
              <div className="space-y-4">
                <Select value={summaryType} onValueChange={setSummaryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {summaryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || isProcessingFile || !inputText.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Summary'}
                  </Button>
                  <Button variant="outline" onClick={handleClear} disabled={isGenerating || isProcessingFile}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Summary Result
                </span>
                {summary && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopy(summary)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center min-h-[300px]"
                  >
                    <div className="animate-pulse-glow rounded-xl bg-gradient-primary p-4">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                ) : summary ? (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="bg-muted/50 rounded-lg p-4 min-h-[300px] whitespace-pre-wrap">
                      {summary}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Original Length</p>
                        <p className="font-medium">{inputText.length} chars | {inputText.split(' ').filter(w => w.length > 0).length} words</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Summary Length</p>
                        <p className="font-medium">{summary.length} chars | {wordCount} words</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Compression Ratio</p>
                        <Badge variant="secondary">
                          {100 - compressionRatio}% of original
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Reduction</p>
                        <Badge variant="outline">
                          {compressionRatio}% compressed
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center min-h-[300px] text-muted-foreground"
                  >
                    Your summary will appear here
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}