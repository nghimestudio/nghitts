export async function onRequestGet(context: {
  env: {
    piper: R2Bucket;
  };
  params: { lang: string; name: string };
}): Promise<Response> {
  try {
    const { env, params } = context;
    const lang = params.lang;
    const fileName = decodeURIComponent(params.name || '');

    if (!lang || !fileName) {
      return new Response('Language and file name are required', { status: 400 });
    }

    const r2Key = `piper/${lang}/${fileName}`;
    const object = await env.piper.get(r2Key);

    if (!object) {
      return new Response('Model file not found', { status: 404 });
    }

    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.json')) {
      contentType = 'application/json';
    } else if (fileName.endsWith('.onnx')) {
      contentType = 'application/octet-stream';
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': object.size.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving piper model file:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to serve model file',
        message: error instanceof Error ? error.message : String(error),
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
