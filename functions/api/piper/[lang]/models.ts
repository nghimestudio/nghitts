export async function onRequestGet(context: {
  env: {
    piper: R2Bucket;
  };
  params: { lang: string };
}): Promise<Response> {
  try {
    const { env, params } = context;
    const lang = params.lang;

    if (!lang) {
      return new Response(JSON.stringify({ error: 'Language code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const prefix = `piper/${lang}/`;
    const objects = await env.piper.list({ prefix });

    const models = objects.objects
      .filter((obj) => obj.key.endsWith('.onnx.json'))
      .map((obj) => {
        const modelName = obj.key
          .replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
          .replace(/\.onnx\.json$/, '');
        return modelName;
      })
      .filter((name) => name.length > 0)
      .sort();

    return new Response(JSON.stringify({ models }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error listing piper lang models:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to list models',
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
