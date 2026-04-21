import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const solveWithAI = async (image: string, text?: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please solve this problem step-by-step. ${text || ""}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error: any) {
    throw new Error(`AI Solver Error: ${error.message}`);
  }
};

export const generateVideoSummary = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educator. Create a detailed, bulleted summary of the following lesson transcript. Highlight key concepts and formulas.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error: any) {
    throw new Error(`AI Summary Error: ${error.message}`);
  }
};
