"use client";

import { addNotification } from "@/actions/notification";
import { useCurrentUser } from "@/hooks/use-current-user";
import React, { useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
  children: React.ReactNode;
}

export interface IMessage {
  id: string;
  message: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface INotification {
  id: string;
  message: string;
  userId: string;
  eventId: string;
  isRead: boolean;
  createdAt: Date;
}

interface ISocketContext {
  sendMessage: (message: string) => void;
  messages: IMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  stateName: string;
  setStateName: (stateName: string) => void;
  notifications: INotification[];
  setNotifications: React.Dispatch<React.SetStateAction<INotification[]>>;
  sendNotification: (
    message: string,
    recieverUserId: string,
    eventId: string
  ) => void;
  newNotification: boolean;
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("State is not provided");
  }
  return context;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const user = useCurrentUser();
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [stateName, setStateName] = React.useState<string>("");
  const [socket, setSocket] = React.useState<Socket>();
  const [notifications, setNotifications] = React.useState<INotification[]>([]);
  const [newNotification, setNewNotification] = React.useState(false);

  const sendNotification = useCallback(
    (message: string, recieverUserId: string, eventId: string) => {
      const requiredMsg = user?.name ? `${user?.name}: ${message}` : message;
      addNotification(requiredMsg, eventId, recieverUserId);
      if (socket) {
        socket.emit("notification", {
          message: `${user?.name}: ${message}`,
          recieverUserId,
          eventId,
        });
      }
    },
    [socket]
  );

  const onNotificationReceived = useCallback((notification: INotification) => {
    console.log("notification", notification);
    setNotifications((prevNotifications) => [
      notification,
      ...prevNotifications,
    ]);
    setNewNotification(true);
  }, []);

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (message) => {
      console.log("sendMessage.socket", socket);
      if (socket) {
        socket.emit("state:message", message);
      }
    },
    [socket]
  );

  const onMessageReceived = useCallback((message: IMessage) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  useEffect(() => {
    if (!user) return;
    const _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
    _socket.on("state:message", onMessageReceived);
    _socket.on("notification", onNotificationReceived);
    // _socket.on("onChangedState", (state: string) => {
    //   setMessages([]);
    // });
    setSocket(_socket);

    return () => {
      _socket.off("state:message", onMessageReceived);
      _socket.off("notification", onNotificationReceived);
      _socket.disconnect();
      setSocket(undefined);
    };
  }, []);

  useEffect(() => {
    if (user && socket && stateName.trim() !== "") {
      socket.emit("joinStateRoom", {
        stateName,
        name: user?.name,
        image: user?.image ?? "",
        userId: user?.id,
      });
    }
  }, [stateName, socket]);

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        messages,
        setMessages,
        stateName,
        setStateName,
        notifications,
        setNotifications,
        sendNotification,
        newNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
