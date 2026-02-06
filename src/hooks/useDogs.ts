import { useState, useCallback } from 'react';
import type { Dog } from '../types/dog';
import { fetchDogs } from '../services/api';
import { sampleDogs } from '../data/sampleDogs';

interface UseDogsReturn {
  dogs: Dog[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  loadDogs: (apiKey: string, zipCode: string) => Promise<void>;
  loadDemo: () => void;
  nextDog: () => void;
}

export function useDogs(): UseDogsReturn {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [page, setPage] = useState(1);

  const loadDogs = useCallback(async (key: string, zip: string) => {
    setLoading(true);
    setError(null);
    setIsDemo(false);
    setApiKey(key);
    setZipCode(zip);
    setPage(1);

    try {
      const result = await fetchDogs(key, zip, 1);
      if (result.dogs.length === 0) {
        setError('No dogs found near that zip code. Try a different location or increase the search radius.');
        return;
      }
      setDogs(result.dogs);
      setCurrentIndex(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dogs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDemo = useCallback(() => {
    setDogs(sampleDogs);
    setCurrentIndex(0);
    setIsDemo(true);
    setError(null);
  }, []);

  const nextDog = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // If we're running low on dogs, fetch more
      if (!isDemo && next >= dogs.length - 3 && apiKey && zipCode) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchDogs(apiKey, zipCode, nextPage)
          .then((result) => {
            if (result.dogs.length > 0) {
              setDogs((d) => [...d, ...result.dogs]);
            }
          })
          .catch(() => {
            // Silently fail on pagination - user still has remaining dogs
          });
      }
      return next;
    });
  }, [isDemo, dogs.length, apiKey, zipCode, page]);

  return {
    dogs,
    currentIndex,
    loading,
    error,
    isDemo,
    loadDogs,
    loadDemo,
    nextDog,
  };
}
