export async function onRequestGet(context: {
  env: {
    piper: R2Bucket;
  };
  params: {
    name: string;
  };
}): Promise<Response> {
  try {
    const { env, params } = context;
    // Decode in case the frontend sent encodeURIComponent for spaces/special chars
    const fileName = decodeURIComponent(params.name || '');
    
    if (!fileName) {
      return new Response('File name is required', { status: 400 });
    }
    
    // Construct R2 key (fileName should be like "en_US-amy-medium.onnx" or "en_US-amy-medium.onnx.json")
    const r2Key = `piper/${fileName}`;
    
    // Get the object from R2
    const object = await env.piper.get(r2Key);
    
    if (!object) {
      return new Response('Model file not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.json')) {
      contentType = 'application/json';
    } else if (fileName.endsWith('.onnx')) {
      contentType = 'application/octet-stream';
    }
    
    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': object.size.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving model file:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to serve model file', 
        message: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

