import { useEffect, useRef, useState, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function getWsUrl(path) {
  const base = BACKEND_URL.replace(/^http/, 'ws');
  return `${base}/api${path}`;
}

export function useWebSocket(path, { onMessage, autoReconnect = true } = {}) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl(path);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [path, autoReconnect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}

export function useNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const { connected, send } = useWebSocket(
    userId ? `/ws/notifications/${userId}` : null,
    {
      onMessage: (data) => {
        if (data.type === 'init') {
          setUnreadCount(data.unread_count);
        } else if (data.type === 'unread_update') {
          setUnreadCount(data.unread_count);
        } else if (data.type === 'notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    }
  );

  const markRead = useCallback((notificationId) => {
    send({ action: 'mark_read', notification_id: notificationId });
  }, [send]);

  const markAllRead = useCallback(() => {
    send({ action: 'mark_all_read' });
  }, [send]);

  return { connected, unreadCount, notifications, markRead, markAllRead };
}

export function useRideTracking(rideId) {
  const [rideState, setRideState] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [eta, setEta] = useState(null);

  const { connected, send } = useWebSocket(
    rideId ? `/ws/ride/${rideId}` : null,
    {
      onMessage: (data) => {
        if (data.type === 'ride_state') {
          setRideState(data.ride);
        } else if (data.type === 'position_update') {
          setDriverPosition(data.driver_position);
          setEta(data.eta_minutes);
          if (data.status) {
            setRideState(prev => prev ? { ...prev, status: data.status } : prev);
          }
        } else if (data.type === 'ride_ended' || data.type === 'ride_cancelled') {
          setRideState(prev => prev ? { ...prev, status: data.status || 'completed' } : prev);
        }
      }
    }
  );

  const cancelRide = useCallback(() => {
    send({ action: 'cancel' });
  }, [send]);

  return { connected, rideState, driverPosition, eta, cancelRide };
}

export function useChat(rideId) {
  const [messages, setMessages] = useState([]);

  const { connected, send } = useWebSocket(
    rideId ? `/ws/chat/${rideId}` : null,
    {
      onMessage: (data) => {
        if (data.type === 'chat_history') {
          setMessages(data.messages || []);
        } else if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        }
      }
    }
  );

  const sendMessage = useCallback((content, senderType = 'user', senderName = '') => {
    send({ action: 'send_message', content, sender_type: senderType, sender_name: senderName });
  }, [send]);

  return { connected, messages, sendMessage };
}
