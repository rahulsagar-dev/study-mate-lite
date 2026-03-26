import { motion } from "framer-motion";
import { useState, useRef } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFlashcards } from "@/hooks/useFlashcards";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Upload,
  X,
  FileText,
  Download,
  Save,
  Trash2,
  History,
  Play,
  Loader2,
  LogIn,
} from "lucide-react";

// Data interfaces for backward compatibility
interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: Date;
  source: 'text' | 'file';
  sourceFileName?: string;
}

// Mock data for initial display
const mockCards: Flashcard[] = [
  {
    id: "1",
    front: "What is the capital of France?",
    back: "Paris is the capital and largest city of France, known for the Eiffel Tower, Louvre Museum, and rich cultural heritage."
  },
  {
    id: "2", 
    front: "Explain photosynthesis",
    back: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen using chlorophyll."
  },
  {
    id: "3",
    front: "What is machine learning?",
    back: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
  }
];

export default function Flashcards() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCards, setCurrentCards] = useState<Flashcard[]>(mockCards);
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cardCount, setCardCount] = useState("15-20");
  const [setName, setSetName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    flashcardSets, 
    loading, 
    generationHistory, 
    createFlashcardSet, 
    deleteFlashcardSet,
    saveGenerationHistory,
    deleteGenerationHistory 
  } = useFlashcards();

  const currentCard = currentCards[currentCardIndex];

  const nextCard = () => {
    if (currentCardIndex < currentCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

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

      // Save document metadata
      await supabase.from('documents').insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_type: file.name.split('.').pop()?.toLowerCase() || '',
        file_size: file.size,
        extracted_text: parseData.text,
        text_length: parseData.textLength,
        word_count: parseData.wordCount,
        status: 'success'
      });

      toast({
        title: "File Processed",
        description: `${file.name} parsed successfully. ${parseData.wordCount} words extracted.`,
      });

      return parseData.text;
    } catch (error) {
      console.error('File extraction error:', error);
      throw error;
    }
  };

  const getCardCount = (): number => {
    switch (cardCount) {
      case "5-10": return Math.floor(Math.random() * 6) + 5;
      case "10-15": return Math.floor(Math.random() * 6) + 10;
      case "15-20": return Math.floor(Math.random() * 6) + 15;
      case "20-25": return Math.floor(Math.random() * 6) + 20;
      case "auto": return Math.floor(Math.random() * 16) + 10;
      default: return 15;
    }
  };

  const generateNewSet = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate flashcards.",
        variant: "destructive"
      });
      return;
    }

    if (!inputText.trim() && !uploadedFile) {
      toast({
        title: "Input Required",
        description: "Please provide text or upload a file to generate flashcards.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let text = inputText;
      
      if (uploadedFile && !inputText.trim()) {
        text = await extractTextFromFile(uploadedFile);
      }

      if (text.length < 50) {
        toast({
          title: "Input Too Short",
          description: "Please provide at least 50 characters for flashcard generation.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      const count = getCardCount();

      // Call Supabase edge function for AI generation
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-flashcards', {
        body: { 
          input_text: text,
          card_count: count
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate flashcards');
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

      const newCards: Flashcard[] = functionData.flashcards.map((card: any, index: number) => ({
        id: (Date.now() + index).toString(),
        front: card.front,
        back: card.back
      }));

      setCurrentCards(newCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      
      // Save to history
      await saveGenerationHistory({
        input_text: text || undefined,
        source_type: uploadedFile ? 'file' : 'text',
        source_filename: uploadedFile?.name,
        output_data: newCards,
        card_count: newCards.length
      });
      
      toast({
        title: "Flashcards Generated",
        description: `Successfully generated ${newCards.length} flashcards using AI.`,
      });
    } catch (error) {
      console.error('Flashcard generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files.",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|docx)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOCX, or TXT files only.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setInputText(""); // Clear text input when file is uploaded
    
    toast({
      title: "File Uploaded",
      description: `${file.name} is ready for processing.`,
    });
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveCurrentSet = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save flashcard sets.",
        variant: "destructive"
      });
      return;
    }

    if (!setName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your flashcard set.",
        variant: "destructive"
      });
      return;
    }

    if (currentCards.length === 0) {
      toast({
        title: "No Cards",
        description: "Generate some flashcards first.",
        variant: "destructive"
      });
      return;
    }

    const flashcards = currentCards.map(card => ({
      front_text: card.front,
      back_text: card.back
    }));

    const savedSet = await createFlashcardSet(setName, flashcards);
    
    if (savedSet) {
      setSetName("");
    }
  };

  const exportCards = () => {
    if (currentCards.length === 0) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Front,Back\n" +
      currentCards.map(card => `"${card.front.replace(/"/g, '""')}","${card.back.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flashcards.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Flashcards exported as CSV file.",
    });
  };

  const loadFromHistory = (entry: any) => {
    setCurrentCards(entry.output_data);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsHistoryOpen(false);
    
    toast({
      title: "History Loaded",
      description: `Loaded ${entry.card_count} cards from ${new Date(entry.created_at).toLocaleDateString()}.`,
    });
  };

  const deleteFromHistory = async (entryId: string) => {
    await deleteGenerationHistory(entryId);
  };

  const copyCards = (cards: Flashcard[]) => {
    const text = cards.map(card => `Q: ${card.front}\nA: ${card.back}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Flashcards copied to clipboard.",
    });
  };

  const loadSet = (set: any) => {
    const cards = set.flashcards.map((card: any) => ({
      id: card.id,
      front: card.front_text,
      back: card.back_text
    }));
    
    setCurrentCards(cards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    
    toast({
      title: "Set Loaded",
      description: `Loaded "${set.title}" with ${cards.length} cards.`,
    });
  };

  const deleteSet = async (setId: string) => {
    await deleteFlashcardSet(setId);
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
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Flashcards
              </span>
            </h1>
            <p className="text-muted-foreground">
              Generate AI-powered flashcards from text or files
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportCards}
              disabled={currentCards.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  History ({generationHistory.length})
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Generation History</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {!user ? (
                    <div className="text-center py-8">
                      <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Sign in to save and view your generation history.
                      </p>
                    </div>
                  ) : generationHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No generation history yet. Generate some flashcards to get started!
                    </p>
                  ) : (
                    generationHistory.map((entry) => (
                      <Card key={entry.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                {entry.card_count} cards
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {entry.source_type === 'file' ? entry.source_filename : 'Text Input'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadFromHistory(entry)}
                                className="gap-1 flex-1"
                              >
                                <Play className="h-3 w-3" />
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteFromHistory(entry.id)}
                                className="gap-1"
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
        </div>

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="inputText" className="text-sm font-medium mb-2 block">
                  Study Material
                </Label>
                <Textarea
                  id="inputText"
                  placeholder="Paste your study material here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">OR</div>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  File Upload
                </Label>
                <div className="space-y-3">
                  {uploadedFile ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="flex-1 text-sm font-medium">{uploadedFile.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeFile}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload .txt, .pdf, .docx, or .pptx files
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.docx,.pptx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="cardCount" className="text-sm font-medium">
                    Card Count
                  </Label>
                  <Select value={cardCount} onValueChange={setCardCount}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-10">5-10 cards</SelectItem>
                      <SelectItem value="10-15">10-15 cards</SelectItem>
                      <SelectItem value="15-20">15-20 cards (recommended)</SelectItem>
                      <SelectItem value="20-25">20-25 cards</SelectItem>
                      <SelectItem value="auto">Auto (based on content)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateNewSet}
                  disabled={isGenerating || (!inputText.trim() && !uploadedFile)}
                  className="gap-2 mt-6"
                  size="lg"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Card {currentCardIndex + 1} of {currentCards.length}
            </Badge>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCardIndex + 1) / currentCards.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentCardIndex + 1) / currentCards.length) * 100)}%
            </span>
          </div>

          {/* Flashcard */}
          <div className="flex justify-center">
            <div className={`flip-card w-full max-w-2xl h-80 ${isFlipped ? 'flipped' : ''}`}>
              <div
                className="flip-card-inner cursor-pointer"
                onClick={handleFlip}
              >
                {/* Front */}
                <div className="flip-card-front">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <Brain className="h-12 w-12 text-primary mb-6" />
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4">
                      {currentCard?.front}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Click to reveal answer
                    </p>
                  </CardContent>
                </div>

                {/* Back */}
                <div className="flip-card-back">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center mb-6">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-lg lg:text-xl leading-relaxed">
                      {currentCard?.back}
                    </p>
                  </CardContent>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevCard}
              disabled={currentCards.length <= 1}
              className="gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleFlip}
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Flip
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={nextCard}
              disabled={currentCards.length <= 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Save Section */}
          <Card>
            <CardContent className="p-6">
              {!user ? (
                <div className="text-center py-4">
                  <LogIn className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">
                    Sign in to save your flashcard sets
                  </p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="setName" className="text-sm font-medium">
                      Save Current Set
                    </Label>
                    <Input
                      id="setName"
                      placeholder="Enter set name..."
                      value={setName}
                      onChange={(e) => setSetName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={saveCurrentSet} className="gap-2 mt-6" disabled={loading}>
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Set'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Sets */}
          {user && flashcardSets.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Saved Sets</h3>
                <div className="space-y-3">
                  {flashcardSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{set.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {set.flashcards.length} cards • {new Date(set.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadSet(set)}
                          className="gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSet(set.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}