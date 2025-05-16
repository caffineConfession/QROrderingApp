'use server';
/**
 * @fileOverview Suggests a coffee or shake flavor based on the user's location.
 *
 * - suggestFlavor - A function that suggests a flavor.
 * - SuggestFlavorInput - The input type for the suggestFlavor function.
 * - SuggestFlavorOutput - The return type for the suggestFlavor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFlavorInputSchema = z.object({
  location: z
    .string()
    .describe('The general location of the user, e.g. city, state.'),
});
export type SuggestFlavorInput = z.infer<typeof SuggestFlavorInputSchema>;

const SuggestFlavorOutputSchema = z.object({
  flavor: z.string().describe('The suggested flavor of coffee or shake.'),
  reason: z
    .string()
    .describe('The reason for suggesting this particular flavor.'),
});
export type SuggestFlavorOutput = z.infer<typeof SuggestFlavorOutputSchema>;

export async function suggestFlavor(input: SuggestFlavorInput): Promise<SuggestFlavorOutput> {
  return suggestFlavorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFlavorPrompt',
  input: {schema: SuggestFlavorInputSchema},
  output: {schema: SuggestFlavorOutputSchema},
  prompt: `You are a flavor expert at Caffico, a popular coffee and shake kiosk. Based on the user's current location, suggest a popular flavor of coffee or shake.

Location: {{{location}}}

Consider these available options:

Blended Cold Coffee: vanilla, original, hazelnut, mocha, caramel, chocolate
Shakes: chocolate, kitkat, oreo, strawberry, oreo coffee.

Explain why this flavor would be a good choice for the user in their location.`,
});

const suggestFlavorFlow = ai.defineFlow(
  {
    name: 'suggestFlavorFlow',
    inputSchema: SuggestFlavorInputSchema,
    outputSchema: SuggestFlavorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
