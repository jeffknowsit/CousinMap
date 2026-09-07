const LocationService = {
  /**
   * Check current location permission status
   * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'unavailable'
   */
  async checkPermission() {
    if (!navigator.permissions) return 'prompt';
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state; // 'granted', 'denied', 'prompt'
    } catch {
      return 'prompt';
    }
  },

  /**
   * Get current device position
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
   */
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          let message;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable. Please check your GPS/location settings.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
            default:
              message = 'An unknown error occurred while getting location.';
          }
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  },

  /**
   * Watch position changes (returns watch ID for cleanup)
   */
  watchPosition(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback?.(new Error('Geolocation not supported'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        errorCallback?.(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  },

  /**
   * Clear a position watch
   */
  clearWatch(watchId) {
    if (watchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Check if geolocation is supported
   */
  isSupported() {
    return 'geolocation' in navigator;
  },
};

export default LocationService;
