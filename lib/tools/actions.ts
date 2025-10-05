/**
 * Tool Definitions for Web Search System
 * 
 * This file defines all tools available for the AI to use when processing user queries.
 * The model intelligently selects which tool(s) to call based on the user's intent.
 * 
 * Available Tools:
 * 1. websearch - Standard web search using Parallel AI or Tavily
 * 2. retrieval - Domain/website information retrieval using Tavily
 * 3. weather - Weather information using OpenWeather API
 * 4. greeting - Simple greeting responses without external API calls
 */

import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import Exa from "exa-js";
import { devLog, devWarn, devError } from "@/lib/logger";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate multiple search queries for better coverage
 */
async function generateMultiQueries(searchQuery: string): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-text-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: searchQuery,
        isMultiQuery: true,
      }),
    });

    if (!response.ok) {
      devWarn('Failed to generate multi-queries, using single query');
      return [searchQuery];
    }

    const data = await response.json();
    return data.queries || [searchQuery];
  } catch (error) {
    devWarn('Error generating multi-queries:', error);
    return [searchQuery];
  }
}

/**
 * Search using Parallel AI
 */
async function searchWithParallelAI(queries: string[]) {
  const parallelsApiKey = process.env.PARALLELS_API_KEY;
  if (!parallelsApiKey) {
    throw new Error('Parallel AI API key not configured');
  }

  const limitedQueries = queries.slice(0, 5);
  devLog(`🔍 Performing Parallel AI search with ${limitedQueries.length} queries`);

  const response = await fetch('https://api.parallel.ai/v1beta/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': parallelsApiKey,
    },
    body: JSON.stringify({
      objective: limitedQueries[0],
      search_queries: limitedQueries,
      processor: 'base',
      max_results: 10,
      max_chars_per_result: 6000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Parallel AI search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Search images using Tavily
 */
async function searchImagesWithTavily(query: string, tavilyApiKey: string) {
  try {
    const tvly = tavily({ apiKey: tavilyApiKey });
    const tavilyResponse: any = await tvly.search(query, {
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
      include_images: true,
    });

    const rawImages = tavilyResponse?.images || [];
    const imageUrls = (
      Array.from(
        new Set(
          rawImages
            .map((img: any) => (typeof img === "string" ? img : img?.url))
            .filter((u: any) => typeof u === "string" && /^https?:\/\//.test(u))
        )
      ) as string[]
    ).slice(0, 15);

    devLog(`🖼️ Tavily images extracted: ${imageUrls.length}`);
    return imageUrls;
  } catch (error) {
    devWarn('Failed to fetch images from Tavily:', error);
    return [];
  }
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Tool 1: Web Search
 * Standard web search functionality using Parallel AI or Tavily
 */
export const websearchTool = tool({
  description: 'Search the web for current information, news, articles, and general queries. Use this for broad web searches.',
  parameters: z.object({
    query: z.string().describe('The search query to look up on the web'),
    webTool: z.enum(['parallels', 'tavily']).optional().describe('Search provider preference'),
    tavilyApiKey: z.string().optional().describe('User Tavily API key if provided'),
  }),
  execute: async ({ query, webTool = 'parallels', tavilyApiKey }) => {
    devLog(`🔍 [websearch] Executing web search for: "${query}"`);
    
    const tavilyKey = tavilyApiKey || process.env.TAVILY_API_KEY;
    let searchResults: any[] = [];
    let imageUrls: string[] = [];

    try {
      if (webTool === 'parallels') {
        // Parallel AI search flow
        const searchQueries = await generateMultiQueries(query);
        searchResults = await searchWithParallelAI(searchQueries);
        
        // Get images from Tavily
        if (tavilyKey) {
          imageUrls = await searchImagesWithTavily(query, tavilyKey);
        }
      } else {
        // Tavily search flow
        if (!tavilyKey) {
          throw new Error('Tavily API key not configured');
        }

        const tvly = tavily({ apiKey: tavilyKey });
        const tavilyResponse: any = await tvly.search(query, {
          search_depth: "basic",
          max_results: 15,
          include_answer: false,
          include_raw_content: false,
          include_images: true,
        });

        searchResults = tavilyResponse.results || [];
        
        // Extract images
        const rawImages = tavilyResponse?.images || [];
        imageUrls = (
          Array.from(
            new Set(
              rawImages
                .map((img: any) => (typeof img === "string" ? img : img?.url))
                .filter((u: any) => typeof u === "string" && /^https?:\/\//.test(u))
            )
          ) as string[]
        ).slice(0, 15);
      }

      devLog(`✅ [websearch] Found ${searchResults.length} results, ${imageUrls.length} images`);

      return {
        success: true,
        results: searchResults,
        images: imageUrls,
        query,
      };
    } catch (error) {
      devError('[websearch] Search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        images: [],
        query,
      };
    }
  },
});

/**
 * Tool 2: Retrieval
 * Retrieve full content from a URL using Exa's crawl functionality
 */
export const retrievalTool = tool({
  description: 'Retrieve full content from a URL. Returns text, title, summary, and images. Use this when the user asks about what a website is, what it does, or wants detailed information about a specific URL or domain.',
  parameters: z.object({
    url: z.string().describe('The URL to retrieve content from (e.g., "https://github.com", "openai.com")'),
    include_summary: z.boolean().optional().describe('Include AI-generated summary (default: true)'),
    live_crawl: z.enum(['never', 'auto', 'preferred']).optional().describe('Crawl mode: never (use cache only), auto (crawl if needed), preferred (always crawl fresh). Default: preferred'),
  }),
  execute: async ({ url, include_summary = true, live_crawl = 'preferred' }) => {
    devLog(`🔍 [retrieval] Retrieving content from URL: "${url}"`);

    const exaApiKey = process.env.EXA_API_KEY;

    if (!exaApiKey) {
      return {
        success: false,
        error: 'Exa API key not configured',
        url,
      };
    }

    try {
      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = `https://${url}`;
      }

      const exa = new Exa(exaApiKey);

      // Use Exa's getContents to crawl the URL
      const result = await exa.getContents([fullUrl], {
        text: true,
        summary: include_summary ? true : undefined,
        livecrawl: live_crawl,
      } as any);

      if (!result.results || result.results.length === 0) {
        return {
          success: false,
          error: 'No content retrieved from URL',
          url: fullUrl,
        };
      }

      const content = result.results[0] as any;

      // Extract images from the content
      const images: string[] = [];
      if (content.image) {
        images.push(content.image);
      }
      if (content.favicon) {
        images.push(content.favicon);
      }

      devLog(`✅ [retrieval] Successfully retrieved content from ${fullUrl}`);

      return {
        success: true,
        url: fullUrl,
        title: content.title || '',
        text: content.text || '',
        summary: content.summary || '',
        author: content.author || '',
        publishedDate: content.publishedDate || '',
        images,
        favicon: content.favicon || '',
      };
    } catch (error) {
      devError('[retrieval] Retrieval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
      };
    }
  },
});

/**
 * Tool 3: Weather
 * Get current weather information for a location
 */
export const weatherTool = tool({
  description: 'Get current weather information for a specific location. Use this when the user asks about weather conditions, temperature, or climate.',
  parameters: z.object({
    location: z.string().describe('The city name or location to get weather for (e.g., "New York", "London, UK")'),
  }),
  execute: async ({ location }) => {
    // Delegate to the executeWeather function for consistency
    return executeWeather({ location });
  },
});

/**
 * Tool 4: Greeting
 * Handle simple greetings without external API calls
 */
export const greetingTool = tool({
  description: 'Respond to simple greetings like "hello", "hi", "hey", "good morning", etc. Use this for casual greetings that don\'t require web search or other tools.',
  parameters: z.object({
    greeting: z.string().describe('The greeting message from the user'),
  }),
  execute: async ({ greeting }) => {
    devLog(`👋 [greeting] Handling greeting: "${greeting}"`);
    
    return {
      success: true,
      greeting,
      response: 'greeting_detected',
    };
  },
});

// Export all tools as a single object for easy import
export const tools = {
  websearch: websearchTool,
  retrieval: retrievalTool,
  weather: weatherTool,
  greeting: greetingTool,
};

// Export direct execution functions for manual tool calling
export const executeWebsearch = async (params: { query: string; webTool?: 'parallels' | 'tavily'; tavilyApiKey?: string }) => {
  const { query, webTool = 'parallels', tavilyApiKey } = params;
  devLog(`🔍 [websearch] Executing web search for: "${query}"`);

  const tavilyKey = tavilyApiKey || process.env.TAVILY_API_KEY;
  let searchResults: any[] = [];
  let imageUrls: string[] = [];

  try {
    if (webTool === 'parallels') {
      // Parallel AI search flow
      const searchQueries = await generateMultiQueries(query);
      searchResults = await searchWithParallelAI(searchQueries);

      // Get images from Tavily
      if (tavilyKey) {
        imageUrls = await searchImagesWithTavily(query, tavilyKey);
      }
    } else {
      // Tavily search flow
      if (!tavilyKey) {
        throw new Error('Tavily API key not configured');
      }

      const tvly = tavily({ apiKey: tavilyKey });
      const tavilyResponse: any = await tvly.search(query, {
        search_depth: "basic",
        max_results: 15,
        include_answer: false,
        include_raw_content: false,
        include_images: true,
      });

      searchResults = tavilyResponse.results || [];

      // Extract images
      const rawImages = tavilyResponse?.images || [];
      imageUrls = (
        Array.from(
          new Set(
            rawImages
              .map((img: any) => (typeof img === "string" ? img : img?.url))
              .filter((u: any) => typeof u === "string" && /^https?:\/\//.test(u))
          )
        ) as string[]
      ).slice(0, 15);
    }

    devLog(`✅ [websearch] Found ${searchResults.length} results, ${imageUrls.length} images`);

    return {
      success: true,
      results: searchResults,
      images: imageUrls,
      query,
    };
  } catch (error) {
    devError('[websearch] Search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      images: [],
      query,
    };
  }
};

export const executeRetrieval = async (params: { url: string; include_summary?: boolean; live_crawl?: 'never' | 'auto' | 'preferred' }) => {
  const { url, include_summary = true, live_crawl = 'preferred' } = params;
  devLog(`🔍 [retrieval] Retrieving content from URL: "${url}"`);

  const exaApiKey = process.env.EXA_API_KEY;

  if (!exaApiKey) {
    return {
      success: false,
      error: 'Exa API key not configured',
      url,
    };
  }

  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }

    const exa = new Exa(exaApiKey);

    // Use Exa's getContents to crawl the URL
    const result = await exa.getContents([fullUrl], {
      text: true,
      summary: include_summary ? true : undefined,
      livecrawl: live_crawl,
    } as any);

    if (!result.results || result.results.length === 0) {
      return {
        success: false,
        error: 'No content retrieved from URL',
        url: fullUrl,
      };
    }

    const content = result.results[0] as any;

    // Extract images from the content
    const images: string[] = [];
    if (content.image) {
      images.push(content.image);
    }
    if (content.favicon) {
      images.push(content.favicon);
    }

    devLog(`✅ [retrieval] Successfully retrieved content from ${fullUrl}`);

    return {
      success: true,
      url: fullUrl,
      title: content.title || '',
      text: content.text || '',
      summary: content.summary || '',
      author: content.author || '',
      publishedDate: content.publishedDate || '',
      images,
      favicon: content.favicon || '',
    };
  } catch (error) {
    devError('[retrieval] Retrieval failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
    };
  }
};

export const executeWeather = async (params: { location: string }) => {
  const { location } = params;
  devLog(`🌤️ [weather] Getting weather for: "${location}"`);

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenWeather API key not configured',
      location,
    };
  }

  try {
    // First, get coordinates for the location using Geocoding API
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    );

    if (!geoResponse.ok) {
      devError(`[weather] Geocoding failed: ${geoResponse.status} ${geoResponse.statusText}`);
      throw new Error('Failed to geocode location');
    }

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      return {
        success: false,
        error: `Location "${location}" not found`,
        location,
      };
    }

    const { lat, lon, name, country } = geoData[0];
    devLog(`🌤️ [weather] Geocoded to: ${name}, ${country} (${lat}, ${lon})`);

    // Try One Call API 3.0 first
    let weatherResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`
    );

    let weatherData: any;
    let current: any;

    if (!weatherResponse.ok) {
      devWarn(`[weather] One Call API 3.0 failed (${weatherResponse.status}), trying Current Weather API`);

      // Fallback to Current Weather API (free tier)
      weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );

      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        devError(`[weather] Current Weather API also failed: ${weatherResponse.status} ${errorText}`);
        throw new Error(`Weather API failed: ${weatherResponse.status}`);
      }

      weatherData = await weatherResponse.json();

      // Transform Current Weather API response to match One Call format
      current = {
        temp: weatherData.main.temp,
        feels_like: weatherData.main.feels_like,
        pressure: weatherData.main.pressure,
        humidity: weatherData.main.humidity,
        uvi: 0, // Not available in Current Weather API
        clouds: weatherData.clouds.all,
        visibility: weatherData.visibility,
        wind_speed: weatherData.wind.speed,
        weather: weatherData.weather,
      };

      devLog(`✅ [weather] Weather data retrieved via Current Weather API for ${name}, ${country}`);
    } else {
      weatherData = await weatherResponse.json();
      current = weatherData.current;
      devLog(`✅ [weather] Weather data retrieved via One Call API 3.0 for ${name}, ${country}`);
    }

    return {
      success: true,
      location: `${name}, ${country}`,
      temperature: {
        celsius: Math.round(current.temp),
        fahrenheit: Math.round((current.temp * 9/5) + 32),
      },
      feels_like: {
        celsius: Math.round(current.feels_like),
        fahrenheit: Math.round((current.feels_like * 9/5) + 32),
      },
      description: current.weather[0].description,
      humidity: current.humidity,
      wind_speed: current.wind_speed,
      pressure: current.pressure,
      visibility: current.visibility,
      uv_index: current.uvi || 0,
      clouds: current.clouds,
      icon: current.weather[0].icon,
    };
  } catch (error) {
    devError('[weather] Weather fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      location,
    };
  }
};

export const executeGreeting = async (params: { greeting: string }) => {
  const { greeting } = params;
  devLog(`👋 [greeting] Handling greeting: "${greeting}"`);

  return {
    success: true,
    greeting,
    response: 'greeting_detected',
  };
};

