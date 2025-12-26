export async function onRequestGet(context: {
  env: {
    piper: R2Bucket;
  };
}): Promise<Response> {
  try {
    const { env } = context;
    
    // List all objects in the piper/ prefix
    const objects = await env.piper.list({
      prefix: 'piper/',
    });

    // Filter for .onnx.json files and extract model names
    const models = objects.objects
      .filter((obj) => obj.key.endsWith('.onnx.json'))
      .map((obj) => {
        // Remove 'piper/' prefix and '.onnx.json' suffix
        const modelName = obj.key
          .replace(/^piper\//, '')
          .replace(/\.onnx\.json$/, '');
        return modelName;
      })
      .filter((name) => name.length > 0) // Filter out empty names
      .sort(); // Sort alphabetically

    return new Response(JSON.stringify({ models }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list models', message: error instanceof Error ? error.message : String(error) }),
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

