import OpenAI from "openai";
import { getLucieModel } from "./aiConfig.js";
import { getListingDetails } from "../tools/getListingDetails.js";
import { searchListings } from "../tools/searchListings.js";

const SYSTEM_PROMPT = `
You are Lucie, a warm, concise marketplace shopping assistant inside MarketPlace.
Your primary job is to help users discover, compare, and narrow marketplace listings.
Use the marketplace tools whenever a user asks for products, prices, categories, budgets, locations, or recommendations.
Never invent listings. Recommend only listings returned by tools.
Keep responses conversational and brief. Explain why the recommended items fit the user's request.
If no listings fit, say so and suggest a practical adjustment.
`;

const tools = [
  {
    type: "function",
    name: "searchListings",
    description: "Search the marketplace listings JSON data using product text, category, price, condition, and location filters.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A product, keyword, brand, or need to search for."
        },
        category: {
          type: "string",
          enum: ["Electronics", "Phones", "Computers", "Gaming", "Home", "Fashion"],
          description: "Marketplace category to filter by."
        },
        minPrice: {
          type: "number",
          description: "Minimum listing price in USD."
        },
        maxPrice: {
          type: "number",
          description: "Maximum listing price in USD."
        },
        condition: {
          type: "string",
          description: "Condition text such as Used, Excellent, Like New, or New."
        },
        location: {
          type: "string",
          description: "Lebanese city or area, such as Beirut, Metn, Byblos, Tripoli, Baabda, Jounieh, or Zahle."
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "getListingDetails",
    description: "Get one marketplace listing by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The listing ID."
        }
      },
      required: ["id"],
      additionalProperties: false
    }
  }
];

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function parseArguments(rawArguments) {
  if (!rawArguments) {
    return {};
  }

  try {
    return JSON.parse(rawArguments);
  } catch {
    return {};
  }
}

async function runToolCall(toolCall) {
  const args = parseArguments(toolCall.arguments);

  if (toolCall.name === "searchListings") {
    const listings = searchListings(args).slice(0, 6);
    return {
      output: {
        count: listings.length,
        listings
      },
      products: listings
    };
  }

  if (toolCall.name === "getListingDetails") {
    const listing = getListingDetails(args);
    return {
      output: {
        listing: listing || null
      },
      products: listing ? [listing] : []
    };
  }

  return {
    output: {
      error: `Unknown tool: ${toolCall.name}`
    },
    products: []
  };
}

export async function chatWithLucie(messages) {
  const client = getOpenAIClient();

  if (!client) {
    console.warn("Lucie AI request skipped. Create server/.env with OPENAI_API_KEY=...");
    return {
      message: "Lucie isn't connected to the AI service yet. Add your OpenAI API key in server/.env, then restart the backend.",
      products: []
    };
  }

  const foundProducts = new Map();
  let input = messages.map((message) => ({
    role: message.role,
    content: message.content.trim()
  }));

  for (let step = 0; step < 3; step += 1) {
    const response = await client.responses.create({
      model: getLucieModel(),
      instructions: SYSTEM_PROMPT,
      input,
      tools,
      tool_choice: "auto"
    });

    const functionCalls = response.output.filter((item) => item.type === "function_call");

    if (functionCalls.length === 0) {
      return {
        message: response.output_text || "I can help you search the marketplace. What are you looking for?",
        products: Array.from(foundProducts.values()).slice(0, 4)
      };
    }

    input = input.concat(response.output);

    for (const toolCall of functionCalls) {
      const result = await runToolCall(toolCall);

      result.products.forEach((product) => {
        foundProducts.set(product.id, product);
      });

      input.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(result.output)
      });
    }
  }

  return {
    message: "I found a few marketplace options that may help. Here are the strongest matches from the listings.",
    products: Array.from(foundProducts.values()).slice(0, 4)
  };
}
