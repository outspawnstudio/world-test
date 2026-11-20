import {useCallback, useEffect, useRef, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';

export interface UseAutocompleteSuggestionsReturn {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  error: string | null;
  resetSession: () => void;
}

/**
 * Retrieves global place autocomplete suggestions using the modern Places API (New)
 * AutocompleteSuggestion.fetchAutocompleteSuggestions with session token bundling.
 */
export function useAutocompleteSuggestions(
  inputString: string
): UseAutocompleteSuggestionsReturn {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placesLib) return;

    const trimmed = inputString.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const {AutocompleteSessionToken, AutocompleteSuggestion} = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        setIsLoading(true);
        setError(null);

        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
        });

        if (!cancelled) {
          setSuggestions(res?.suggestions ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Autocomplete error:', err);
          setSuggestions([]);
          setError('Unable to fetch location suggestions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    resetSession,
  };
}
