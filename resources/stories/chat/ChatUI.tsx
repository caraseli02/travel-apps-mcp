import React from "react";

export type ChatTurn = {
  role: "user" | "assistant";
  text?: string;
  widget?: React.ReactNode;
};

export interface ChatUIProps {
  turns: ChatTurn[];
}

export const ChatUI: React.FC<ChatUIProps> = ({ turns }) => {
  return (
    <div className="chat-ui-container">
      <style>{`
        .chat-ui-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 40px 20px;
          max-width: 800px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #f9f9f9;
          min-height: 100vh;
        }
        .chat-turn {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 100%;
        }
        .chat-turn.user {
          align-self: flex-end;
          max-width: 80%;
        }
        .chat-turn.assistant {
          align-self: flex-start;
          width: 100%;
        }
        .chat-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.5;
        }
        .chat-turn.user .chat-bubble {
          background: #e3e3e3;
          color: #000;
          border-bottom-right-radius: 4px;
        }
        .chat-turn.assistant .chat-bubble {
          background: transparent;
          color: #000;
          padding-left: 0;
          padding-right: 0;
        }
        .chat-widget-container {
          margin-top: 8px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .role-label {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
      `}</style>
      {turns.map((turn, i) => (
        <div key={i} className={`chat-turn ${turn.role}`}>
          <div className="role-label">{turn.role}</div>
          {turn.text && (
            <div className="chat-bubble">
              {turn.text}
            </div>
          )}
          {turn.widget && (
            <div className="chat-widget-container">
              {turn.widget}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
