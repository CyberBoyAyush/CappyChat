import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const userOpenAIKey = formData.get('userOpenAIKey') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Use user's OpenAI API key if provided, otherwise fall back to system key
    const apiKey = userOpenAIKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your OpenAI API key in Settings → Application for voice input.' },
        { status: 500 }
      );
    }

    // Convert File to Buffer for OpenAI Whisper API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create form data for OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', new Blob([buffer], { type: audioFile.type }), audioFile.name);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'json');
    whisperFormData.append('language', 'en'); // You can make this configurable later

    // Call OpenAI's Whisper API endpoint directly
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'AVChat/1.0.0',
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper API error:', errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your OpenAI API key in Settings.' },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (response.status === 413) {
        return NextResponse.json(
          { error: 'Audio file too large. Please record a shorter message.' },
          { status: 413 }
        );
      }

      return NextResponse.json(
        { error: 'Speech recognition failed. Please try again.' },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (!result.text) {
      return NextResponse.json(
        { error: 'No speech detected in audio. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: result.text.trim(),
      success: true
    });

  } catch (error) {
    console.error('Speech-to-text API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
