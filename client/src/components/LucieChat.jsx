import { useEffect, useRef, useState } from "react";
import { chatWithLucie } from "../services/api.js";
import ChatProductCard from "./ChatProductCard.jsx";

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Lucie 👋 I'm here to help you find what you're looking for. Tell me what you need, what you're interested in, or how much you want to spend.",
  products: []
};

function LucieChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, messages, isSending]);

  async function sendMessage(event) {
    event?.preventDefault();
    const text = draft.trim();

    if (!text || isSending) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      products: []
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);

    try {
      const historyForServer = nextMessages
        .filter((message) => message.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      const response = await chatWithLucie(historyForServer);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          products: response.products || []
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error.message || "Sorry, I'm having trouble responding right now. Please try again.",
          products: []
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="lucie-widget">
      {isOpen && (
        <section className="lucie-panel" aria-label="Lucie AI shopping assistant">
          <div className="lucie-header">
            <div className="lucie-identity">
              <span className="lucie-avatar">L</span>
              <div>
                <h2>Lucie</h2>
                <p>Marketplace assistant</p>
              </div>
            </div>
            <button className="icon-button" type="button" onClick={() => setIsOpen(false)} aria-label="Close Lucie">
              ×
            </button>
          </div>

          <div className="lucie-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message-row ${message.role}`}>
                <div className="message-bubble">
                  <p>{message.content}</p>
                  {message.products?.length > 0 && (
                    <div className="chat-products">
                      {message.products.slice(0, 4).map((product) => (
                        <ChatProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="message-row assistant">
                <div className="message-bubble typing">Lucie is searching...</div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form className="lucie-input" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Lucie what to buy..."
              disabled={isSending}
              maxLength={1200}
            />
            <button type="submit" disabled={isSending || !draft.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button className="lucie-launcher" type="button" onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? "Close" : "Ask Lucie"}
      </button>
    </div>
  );
}

export default LucieChat;

