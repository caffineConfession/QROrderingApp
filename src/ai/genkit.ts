
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check for GOOGLE_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim() === "") {
  // This error will be thrown when this module is loaded if the key is missing.
  // Ensure your .env file is correctly set up and the server is restarted.
  throw new Error("GOOGLE_API_KEY is not set or is empty in environment variables. Please provide your Google AI API key in the .env file for Genkit features.");
}

export const ai = genkit({
  plugins: [
    googleAI() // googleAI plugin will use the GOOGLE_API_KEY from the environment
  ],
  // The model here is a general default for the genkit instance.
  // Specific models for prompts are usually defined within the prompt or generate call.
  model: 'googleai/gemini-2.0-flash',
});
