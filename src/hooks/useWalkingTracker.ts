import { useState, useEffect, useRef } from 'react';
import { WalkingData, LocationData } from '../types';
import { useGeolocation } from './useGeolocation';

export function useWalkingTracker() {
  const [walkData, setWalkData] = useState<WalkingData | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<Date | null>(null);
  const positions = useRef<GeolocationPosition[]>([]);
  const totalDistance = useRef(0);
  const speeds = useRef<number[]>([]);

  const {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
    calculateDistance,
    calculateSpeed,
    previousLocation,
  } = useGeolocation();

  const startWalk = () => {
    setIsWalking(true);
    startTime.current = new Date();
    totalDistance.current = 0;
    speeds.current = [];
    positions.current = [];
    
    startTracking();
    
    // Update walk data every second
    intervalRef.current = setInterval(() => {
      updateWalkData();
    }, 1000);
  };

  const stopWalk = (): WalkingData | null => {
    setIsWalking(false);
    stopTracking();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (walkData && startTime.current) {
      const finalWalkData: WalkingData = {
        ...walkData,
        endTime: new Date(),
        duration: Math.floor((Date.now() - startTime.current.getTime()) / 1000),
      };
      
      setWalkData(finalWalkData);
      return finalWalkData;
    }
    
    return null;
  };

  const updateWalkData = () => {
    if (!startTime.current) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.current.getTime()) / 1000);
    
    // Calculate average speed
    const avgSpeed = speeds.current.length > 0 
      ? speeds.current.reduce((a, b) => a + b, 0) / speeds.current.length 
      : 0;
    
    // Calculate max speed
    const maxSpeed = speeds.current.length > 0 ? Math.max(...speeds.current) : 0;
    
    // Estimate steps (rough calculation based on distance and average step length)
    const estimatedSteps = Math.floor(totalDistance.current / 0.7); // ~70cm per step
    
    // Estimate calories (rough calculation)
    const estimatedCalories = Math.floor((totalDistance.current / 1000) * 50); // ~50 cal per km
    
    const newWalkData: WalkingData = {
      id: `walk-${startTime.current.getTime()}`,
      startTime: startTime.current,
      duration,
      distance: totalDistance.current,
      speed: speeds.current[speeds.current.length - 1] || 0,
      avgSpeed,
      maxSpeed,
      steps: estimatedSteps,
      calories: estimatedCalories,
      positions: positions.current,
      elevationGain: 0, // TODO: Calculate from GPS data
      elevationLoss: 0, // TODO: Calculate from GPS data
    };
    
    setWalkData(newWalkData);
  };

  // Update position and calculate distance/speed when location changes
  useEffect(() => {
    if (location && isWalking && previousLocation) {
      const distance = calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      const timeDelta = location.timestamp - previousLocation.timestamp;
      const speed = calculateSpeed(distance, timeDelta);
      
      // Only update if we've moved a reasonable distance (filter out GPS noise)
      if (distance > 1) { // 1 meter threshold
        totalDistance.current += distance;
        speeds.current.push(speed);
        
        // Keep only last 100 speed readings for performance
        if (speeds.current.length > 100) {
          speeds.current = speeds.current.slice(-100);
        }
      }
      
      // Add position to track
      positions.current.push({
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.elevation || null,
          altitudeAccuracy: null,
          heading: null,
          speed: speed / 3.6, // Convert km/h to m/s
        },
        timestamp: location.timestamp,
      } as GeolocationPosition);
    }
  }, [location, isWalking, previousLocation, calculateDistance, calculateSpeed]);

  const pauseWalk = () => {
    stopTracking();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resumeWalk = () => {
    startTracking();
    intervalRef.current = setInterval(() => {
      updateWalkData();
    }, 1000);
  };

  return {
    walkData,
    isWalking,
    isTracking,
    error,
    startWalk,
    stopWalk,
    pauseWalk,
    resumeWalk,
    location,
  };
}