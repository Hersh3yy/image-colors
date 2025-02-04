const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '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',
});

const handler = async (event) => {
  console.log("Starting verify-colors handler");

  // Authorization check (if you want to keep it consistent with upload function)
  const accessToken = event.queryStringParameters?.access;
  if (accessToken !== process.env.PRESET_ACCESS_TOKEN) {
    return { 
      statusCode: 403, 
      body: JSON.stringify({ error: "Unauthorized" }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }

  try {
    console.log("Parsing request body...");
    const { colors } = JSON.parse(event.body);
    
    console.log("Received colors data:", {
      colorCount: colors?.length,
      firstColor: colors?.[0]
    });

    if (!colors || !Array.isArray(colors)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: colors array is required' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      };
    }

    // Format the color data for the prompt
    const colorDescriptions = colors.map(color => `
      Original Color: ${color.originalColor}
      Matched Pantone: ${color.matchedPantone.name} (${color.matchedPantone.hex}, distance: ${color.matchedPantone.distance})
      Matched Parent: ${color.matchedParent.name} (${color.matchedParent.hex}, distance: ${color.matchedParent.distance})
      Percentage in Image: ${color.percentage}%
    `).join('\n');

    console.log("Making OpenAI API call...");
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a color science expert specializing in color matching and analysis."
        },
        {
          role: "user",
          content: `As a color matching expert, analyze these color matches and identify any potential improvements or inaccuracies. Focus on cases where the matched colors seem off, especially for greys being matched to greens or other obvious mismatches. Consider both the color values and the context.

Color Matches to Analyze:
${colorDescriptions}

Please provide:
1. A list of potentially problematic matches
2. Suggested better matches if any
3. Explanation of why these might be better matches
4. Any patterns in the mismatches that could help improve the matching algorithm

Format your response in a clear, structured way that can be easily parsed and displayed to the user.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const duration = Date.now() - startTime;
    console.log("OpenAI API call complete:", {
      duration,
      responseTokens: completion.usage?.total_tokens
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        analysis: completion.choices[0].message.content
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  } catch (error) {
    console.error('Verification error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error instanceof OpenAI.APIError) {
      return {
        statusCode: error.status || 500,
        body: JSON.stringify({
          error: `OpenAI API Error: ${error.message}`,
          type: error.type,
          details: error.stack
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process color verification',
        type: error.name,
        details: error.stack
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }
};

module.exports = { handler };