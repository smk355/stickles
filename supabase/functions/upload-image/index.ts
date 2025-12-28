import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("=== Function invoked ===");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing POST request");
    
    // Parse body
    const body = await req.json();
    console.log("Body parsed, image present:", !!body.image);
    console.log("Folder:", body.folder);
    
    const image = body.image;
    const folder = body.folder || "products";

    if (!image || typeof image !== "string") {
      console.error("Invalid image data");
      return new Response(
        JSON.stringify({ error: "Invalid or missing image (base64 expected)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Cloudinary config
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET");

    console.log("Cloud name:", cloudName);
    console.log("Upload preset:", uploadPreset);

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary config missing");
      return new Response(
        JSON.stringify({ error: "Cloudinary not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to Cloudinary
    console.log("Creating form data...");
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `products/${folder}`);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log("Uploading to:", cloudinaryUrl);

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    console.log("Cloudinary status:", cloudinaryResponse.status);

    const result = await cloudinaryResponse.json();
    console.log("Cloudinary response:", JSON.stringify(result).substring(0, 200));

    if (!cloudinaryResponse.ok) {
      console.error("Cloudinary upload failed:", result);
      return new Response(
        JSON.stringify({ 
          error: "Cloudinary upload failed", 
          details: result
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful!");
    return new Response(
      JSON.stringify({
        url: result.secure_url,
        public_id: result.public_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("=== Error caught ===");
    console.error("Error:", err);
    console.error("Message:", err?.message);
    console.error("Stack:", err?.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: err?.message || "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});