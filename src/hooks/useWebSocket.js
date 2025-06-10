import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../services/AuthContext.jsx'; // Explicit .jsx extension
import toast from 'react-hot-toast';

export const useWebSocket = (originalUrl, options = {}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');

  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    requiresAuth = true
  } = options;

  const reconnectTimeoutId = useRef(null);
  const reconnectCount = useRef(0);
  const isMounted = useRef(false);

  const getCodespaceWsUrl = useCallback((baseHttpUrl, wsPath) => {
    try {
      const urlObj = new URL(baseHttpUrl);
      urlObj.protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      if (urlObj.port === '3000' || urlObj.port === '8080' || urlObj.port === '5000') {
        urlObj.port = '';
      }
      return `${urlObj.href.replace(/\/$/, '')}${wsPath.startsWith('/') ? '' : '/'}${wsPath}`;
    } catch (e) {
      console.error("Failed to construct Codespace WebSocket URL:", e);
      return originalUrl.replace(/^http/, 'ws');
    }
  }, [originalUrl]);

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (requiresAuth && (!isAuthenticated || !user || authLoading)) {
      setConnectionStatus('Waiting for authentication...');
      setReadyState(WebSocket.CLOSED);
      if (import.meta.env.MODE !== 'production') {
        console.log('WebSocket: Waiting for authentication before connecting.');
      }
      return;
    }

    try {
      let wsUrl = originalUrl;
      if (window.location.hostname.endsWith('.app.github.dev') || window.location.hostname.includes('codesandbox.io')) {
         wsUrl = getCodespaceWsUrl(window.location.href, originalUrl.startsWith('/') ? originalUrl : `/${originalUrl.split('://')[1].split('/')[1] || ''}`);
      } else {
         wsUrl = originalUrl.replace(/^http/, 'ws');
      }

      if (requiresAuth && user?.token) {
        wsUrl = `${wsUrl}?token=${user.token}`;
      } else if (requiresAuth && (!user || !user.token)) {
          setConnectionStatus('Disconnected: No Auth Token');
          setReadyState(WebSocket.CLOSED);
          console.warn('WebSocket: Attempted to connect to authenticated endpoint without a token.');
          return;
      }

      const ws = new WebSocket(wsUrl);
      setSocket(ws);
      setReadyState(WebSocket.CONNECTING);
      setConnectionStatus('Connecting...');

      ws.onopen = (event) => {
        if (!isMounted.current) return ws.close();
        setReadyState(WebSocket.OPEN);
        setConnectionStatus('Open');
        reconnectCount.current = 0;
        if (onOpen) onOpen(event);
        if (import.meta.env.MODE !== 'production') {
          console.log('WebSocket: Connected successfully to', wsUrl);
        }
      };

      ws.onclose = (event) => {
        if (!isMounted.current && event.code !== 1000) return;
        setReadyState(WebSocket.CLOSED);
        setConnectionStatus('Closed');
        if (onClose) onClose(event);
        if (import.meta.env.MODE !== 'production') {
          console.log('WebSocket: Connection closed.', event.code, event.reason);
        }

        if (shouldReconnect && reconnectCount.current < reconnectAttempts && !event.wasClean) {
          reconnectCount.current++;
          setConnectionStatus(`Reconnecting (Attempt ${reconnectCount.current}/${reconnectAttempts})...`);
          if (import.meta.env.MODE !== 'production') {
            console.log(
              `WebSocket: Reconnecting (Attempt ${reconnectCount.current})...`
            );
          }
          reconnectTimeoutId.current = setTimeout(() => {
            if (isMounted.current) connect();
          }, reconnectInterval);
        } else if (shouldReconnect && reconnectCount.current >= reconnectAttempts) {
          setConnectionStatus('Reconnection failed. Max attempts reached.');
          console.warn('WebSocket: Max reconnection attempts reached. Giving up.');
          toast.error('WebSocket connection lost. Please refresh the page if issues persist.');
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          if (onMessage) onMessage(message);
        } catch (parseError) {
          console.error('WebSocket: Failed to parse message:', parseError);
          if (onError) onError(new Error('Failed to parse WebSocket message'));
          toast.error('Received malformed WebSocket message.');
        }
      };

      ws.onerror = (event) => {
        if (!isMounted.current) return;
        setConnectionStatus('Error');
        console.error('WebSocket error:', event);
        if (onError) onError(event);
        toast.error('WebSocket error encountered.');
        ws.close();
      };

    } catch (error) {
      console.error('WebSocket connection setup failed:', error);
      setConnectionStatus('Error');
      if (onError) onError(error);
      if (shouldReconnect && reconnectCount.current < reconnectAttempts) {
        reconnectCount.current++;
        reconnectTimeoutId.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, reconnectInterval);
      }
    }
  }, [originalUrl, user, isAuthenticated, authLoading, onOpen, onClose, onMessage, onError, shouldReconnect, reconnectAttempts, reconnectInterval, requiresAuth, getCodespaceWsUrl]);

  useEffect(() => {
    isMounted.current = true;

    if (!authLoading) {
      if (!requiresAuth || isAuthenticated) {
        if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
          connect();
        }
      } else {
        if (socket && socket.readyState === WebSocket.OPEN) {
          disconnect();
        }
        setConnectionStatus('Disconnected: Not Authenticated');
        setReadyState(WebSocket.CLOSED);
      }
    }

    return () => {
      isMounted.current = false;
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [user, isAuthenticated, authLoading, originalUrl, connect, disconnect, requiresAuth, socket]);

  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      toast.error('WebSocket not connected. Please refresh or check your internet.');
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    if (socket) {
      socket.close(1000, 'Explicit disconnect by client');
      setSocket(null);
      setConnectionStatus('Disconnected');
      setReadyState(WebSocket.CLOSED);
    }
  }, [socket]);

  return {
    socket,
    lastMessage,
    readyState,
    connectionStatus,
    sendMessage,
    disconnect
  };
};