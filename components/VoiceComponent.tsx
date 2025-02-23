"use client";

import React, { useEffect, useState } from "react";
import { useConversation as use11LabsConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useTable } from "@/components/TableContext";
import { useConversation } from "@/components/ConversationContext";

interface VoiceChatProps {
  operationId: string | null;
}

const VoiceChat = ({ operationId }: VoiceChatProps) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { addRow } = useTable();
  const { setConversationId } = useConversation();

  const conversation = use11LabsConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      //setConversationId(null);
    },
    onMessage: (message: string) => console.log("Received message:", message),
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
      console.error("Error:", error);
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (error) {
        setErrorMessage("Microphone access denied. Please enable microphone.");
        console.error("Error accessing microphone:", error);
      }
    };
    requestMicPermission();
  }, []);

  const handleStartConversation = async () => {
    try {
      const conversationId = await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
        clientTools: {
          displayEvent: async ({eventValue, eventType}: {eventValue: string, eventType: string}) => {
            addRow(eventValue);
            await fetch('https://ec2-52-91-35-107.compute-1.amazonaws.com:5000/api/sendNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ operationId, eventValue, eventType })
            });
          }
        }
      });
      setConversationId(conversationId);
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      setConversationId(null);
    } catch (error) {
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  return (
    <div className="flex-1">
      <Button 
        onClick={status === "connected" ? handleEndConversation : handleStartConversation} 
        disabled={!hasPermission} 
        className="w-full"
      >
        {status === "connected" ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
        {status === "connected" ? "End Conversation" : "Start Conversation"}
      </Button>
      <div className="text-center text-sm mt-2">
        {status === "connected" && <p className="text-green-600">{isSpeaking ? "Agent is speaking..." : "Listening..."}</p>}
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {!hasPermission && <p className="text-yellow-600">Please allow microphone access to use voice chat</p>}
      </div>
    </div>
  );
};

export default VoiceChat;
