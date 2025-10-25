import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('File path is required');
    }

    console.log('Parsing document:', filePath);

    // Get file extension
    const fileExt = filePath.toLowerCase().split('.').pop();
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    let extractedText = '';
    let wordCount = 0;
    let textLength = 0;

    // Parse based on file type
    if (fileExt === 'txt') {
      extractedText = await fileData.text();
    } else if (fileExt === 'pdf') {
      // For PDF, we'll use a simple extraction
      // In production, you'd use pdf-parse or similar
      const arrayBuffer = await fileData.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      // Basic PDF text extraction (this is simplified)
      extractedText = text.replace(/[^\x20-\x7E\n]/g, '').trim();
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error('PDF parsing requires additional libraries. Please convert to TXT format.');
      }
    } else if (fileExt === 'docx') {
      throw new Error('DOCX format requires additional libraries. Please convert to TXT or PDF format.');
    } else {
      throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT only.');
    }

    // Calculate metrics
    textLength = extractedText.length;
    wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

    // Update document metadata in database
    const fileName = filePath.split('/').pop();
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        extracted_text: extractedText,
        text_length: textLength,
        word_count: wordCount,
        parsed_at: new Date().toISOString(),
        processing_status: 'success'
      })
      .eq('user_id', user.id)
      .eq('file_name', fileName);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log(`Successfully parsed document: ${wordCount} words, ${textLength} characters`);

    return new Response(
      JSON.stringify({
        text: extractedText,
        wordCount,
        textLength,
        status: 'success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Parse document error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: 'failed'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
