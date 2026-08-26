import { useCallback, useEffect, useRef, useState } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { api } from '../services/api';

export function useTwilioDevice() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);

  const initDevice = useCallback(async () => {
    try {
      const { token } = await api.getToken();

      if (deviceRef.current) {
        deviceRef.current.destroy();
      }

      const device = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        logLevel: 'error',
      });

      device.on('registered', () => {
        setIsReady(true);
        setError(null);
      });

      device.on('error', (deviceError) => {
        setError(deviceError.message || 'Device error occurred');
        setIsReady(false);
      });

      device.on('tokenWillExpire', async () => {
        try {
          const { token: newToken } = await api.getToken();
          device.updateToken(newToken);
        } catch {
          setError('Failed to refresh token');
        }
      });

      await device.register();
      deviceRef.current = device;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize device';
      setError(message);
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    initDevice();

    return () => {
      activeCallRef.current?.disconnect();
      deviceRef.current?.destroy();
    };
  }, [initDevice]);

  const connect = useCallback(
    async (to: string): Promise<Call> => {
      const device = deviceRef.current;
      if (!device) {
        throw new Error('Device not ready');
      }

      const call = await device.connect({
        params: { To: to },
      });

      activeCallRef.current = call;
      return call;
    },
    [],
  );

  const disconnect = useCallback(() => {
    activeCallRef.current?.disconnect();
    activeCallRef.current = null;
  }, []);

  const getActiveCall = useCallback(() => activeCallRef.current, []);

  return {
    isReady,
    error,
    connect,
    disconnect,
    getActiveCall,
    reinitialize: initDevice,
  };
}
