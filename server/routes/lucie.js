import { Router } from "express";
import { chatWithLucie } from "../services/lucieService.js";

const router = Router();
const MAX_MESSAGE_LENGTH = 1200;
const MAX_MESSAGES = 16;
const allowedRoles = new Set(["user", "assistant"]);

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "messages must be a non-empty array.";
  }

  if (messages.length > MAX_MESSAGES) {
    return `messages may contain at most ${MAX_MESSAGES} items.`;
  }

  for (const message of messages) {
    if (!message || !allowedRoles.has(message.role)) {
      return "Each message must have role user or assistant.";
    }

    if (typeof message.content !== "string" || message.content.trim().length === 0) {
      return "Each message must include non-empty content.";
    }

    if (message.content.length > MAX_MESSAGE_LENGTH) {
      return `Messages may be at most ${MAX_MESSAGE_LENGTH} characters.`;
    }
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return "The latest message must be from the user.";
  }

  return null;
}

router.post("/chat", async (req, res) => {
  const validationError = validateMessages(req.body?.messages);

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const response = await chatWithLucie(req.body.messages);
    res.json(response);
  } catch (error) {
    console.error("Lucie chat failed:", error.message);
    res.status(500).json({
      message: "Sorry, I'm having trouble responding right now. Please try again.",
      products: []
    });
  }
});

export default router;

