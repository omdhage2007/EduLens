import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function askGemini(prompt: string, context: string = "") {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are EduLens AI, an intelligent assistant for school administrators and teachers. You specialize in student analytics, learning gap detection, attendance patterns, and personalized education. Keep responses practical, concise, and educator-focused.",
  });

  const result = await model.generateContent(`${context}\n\nUser Question: ${prompt}`);
  return result.response.text();
}

export async function extractQuestionsFromImage(base64Image: string, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = "Extract all questions from this question paper image. Provide them as a clean list with proper numbering. Do not include any other text.";
  
  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    },
    { text: prompt }
  ]);

  const text = result.response.text();
  return text.split('\n').filter(q => q.trim().length > 0);
}

export async function gradeAnswerSheet(base64Image: string, mimeType: string, questions: string[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    You are an expert teacher. Grade this student's answer sheet based on the following questions:
    ${questions.join('\n')}
    
    Provide a structured response in JSON format:
    {
      "feedback": "Detailed feedback for the student",
      "score": 85,
      "maxScore": 100,
      "percentage": 85
    }
  `;
  
  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    },
    { text: prompt }
  ]);

  const text = result.response.text();
  // Extract JSON from the response (Gemini might wrap it in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to parse AI response");
}
