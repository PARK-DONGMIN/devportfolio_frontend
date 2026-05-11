import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../api/axios';

export default function useNotificationSocket(user, onNotification) {
  const clientRef = useRef(null);

  const onNotificationRef = useRef(onNotification);
  useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }
  }, []);

  useEffect(() => {
    if (!user) {
      disconnect();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body);
          onNotificationRef.current(notification);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [user, disconnect]);

  return disconnect;
}
