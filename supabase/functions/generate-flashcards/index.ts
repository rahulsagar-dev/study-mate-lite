import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: userId -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove old timestamps outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = recentRequests[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  return { allowed: true };
}

async function logError(supabase: any, userId: string, inputText: string, errorMessage: string) {
  try {
    await supabase.from('ai_error_logs').insert({
      user_id: userId,
      feature: 'flashcard_generation',
      input_text: inputText?.substring(0, 500), // Limit stored text length
      error_message: errorMessage
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth token
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before generating more flashcards.',
        retryAfter: rateLimitCheck.retryAfter
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': rateLimitCheck.retryAfter!.toString()
        }
      });
    }

    const { input_text, card_count = 15 } = await req.json();

    if (!input_text || input_text.trim().length < 50) {
      const errorMsg = 'Input text is too short. Please provide at least 50 characters.';
      await logError(supabase, user.id, input_text, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Lovable AI (Gemini) via gateway
    const systemPrompt = `You are a flashcard generator. Generate ${card_count} educational flashcards from the provided text. Each flashcard should have a clear question on the front and a comprehensive answer on the back. Return ONLY a JSON array of objects with "front" and "back" properties. No additional text or explanation.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${card_count} flashcards from this text:\n\n${input_text}` }
        ],
        temperature: 0.7,
      }),
    });

    if (aiResponse.status === 429) {
      const errorMsg = 'AI service rate limit exceeded. Please try again later.';
      await logError(supabase, user.id, input_text, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (aiResponse.status === 402) {
      const errorMsg = 'AI service payment required. Please add credits to your workspace.';
      await logError(supabase, user.id, input_text, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      const errorMsg = 'AI service unavailable, please retry.';
      await logError(supabase, user.id, input_text, `${errorMsg} - ${errorText}`);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      const errorMsg = 'Failed to generate flashcards from AI response.';
      await logError(supabase, user.id, input_text, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the JSON response
    let flashcards;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(generatedText);
      }

      // Validate the structure
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('Invalid flashcard format');
      }

      // Ensure each flashcard has the required properties
      flashcards = flashcards.map((card, index) => ({
        front: card.front || card.question || `Question ${index + 1}`,
        back: card.back || card.answer || `Answer ${index + 1}`
      }));
    } catch (parseError) {
      console.error('Failed to parse flashcards:', parseError, generatedText);
      const errorMsg = 'Failed to parse AI response. Please try again.';
      await logError(supabase, user.id, input_text, `${errorMsg} - ${parseError}`);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ flashcards }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-flashcards function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
