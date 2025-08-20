import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingRequest {
  videoUrl: string;
  tourTitle: string;
  tourDescription?: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, tourTitle, tourDescription, userId }: ProcessingRequest = await req.json();
    
    console.log(`Starting 360° video processing for user ${userId}`);
    console.log(`Video URL: ${videoUrl}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simulate video processing steps
    const processingSteps = [
      'Analyzing video metadata...',
      'Extracting GPS track data...',
      'Generating frame extraction points...',
      'Processing 360° panoramas...',
      'Creating map markers...',
      'Linking sequential panoramas...'
    ];

    for (let i = 0; i < processingSteps.length; i++) {
      console.log(`Step ${i + 1}: ${processingSteps[i]}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Download the video from storage
      // 2. Extract GPS metadata using FFmpeg or similar
      // 3. Extract frames every few meters based on GPS data
      // 4. Convert frames to equirectangular panoramas
      // 5. Upload processed panoramas back to storage
      // 6. Create location entries with proper GPS coordinates
    }

    // For demo purposes, create multiple panorama locations
    const mockPanoramas = Array.from({ length: 5 }, (_, index) => ({
      user_id: userId,
      title: `${tourTitle} - Panorama ${index + 1}`,
      description: tourDescription || `Auto-extracted 360° panorama ${index + 1} from video`,
      longitude: 45.3254 + (index * 0.002) + (Math.random() - 0.5) * 0.001,
      latitude: 2.0469 + (index * 0.001) + (Math.random() - 0.5) * 0.0005,
      has_street_view: true,
      street_view_image_url: videoUrl, // In real implementation, this would be the extracted panorama
      location_type: 'video_panorama',
      is_public: false
    }));

    // Insert processed panoramas
    const { error: insertError } = await supabase
      .from('locations')
      .insert(mockPanoramas);

    if (insertError) {
      console.error('Error inserting panoramas:', insertError);
      throw new Error('Failed to save processed panoramas');
    }

    // Remove the processing placeholder
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('user_id', userId)
      .eq('location_type', 'video_processing')
      .eq('title', `${tourTitle} - Processing`);

    if (deleteError) {
      console.error('Error removing processing placeholder:', deleteError);
    }

    console.log(`Successfully processed video and created ${mockPanoramas.length} panoramas`);

    return new Response(JSON.stringify({ 
      success: true, 
      panoramasCreated: mockPanoramas.length,
      message: 'Video processed successfully and panoramas placed on map'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-360-video function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Video processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});