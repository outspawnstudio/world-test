import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';
import {ChevronDown, Compass, Loader2, MapPin, Search, X} from 'lucide-react';
import {WORLD_LANDMARKS} from '../constants/worldPresets';
import {useAutocompleteSuggestions} from '../hooks/useAutocompleteSuggestions';
import type {ActiveLocationInfo, LandmarkPreset} from '../types/drive';

interface LocationSearchBarProps {
  activeLocation: ActiveLocationInfo;
  isTeleporting: boolean;
  onSelectDestination: (
    lat: number,
    lng: number,
    name: string,
    subtitle: string,
    heading?: number
  ) => void;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  activeLocation,
  isTeleporting,
  onSelectDestination,
}) => {
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {suggestions, isLoading, error, resetSession} =
    useAutocompleteSuggestions(query);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      setSelecting(true);
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });
        if (!place.location) {
          return;
        }
        const lat = place.location.lat();
        const lng = place.location.lng();
        const name =
          place.displayName ||
          suggestion.placePrediction.mainText?.text ||
          'Selected Destination';
        const subtitle =
          place.formattedAddress ||
          suggestion.placePrediction.secondaryText?.text ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        setQuery('');
        setIsOpen(false);
        resetSession();
        onSelectDestination(lat, lng, name, subtitle);
      } catch (err) {
        console.error('Failed to fetch place location:', err);
      } finally {
        setSelecting(false);
      }
    },
    [placesLib, onSelectDestination, resetSession]
  );

  const handlePresetClick = (preset: LandmarkPreset) => {
    setShowPresets(false);
    setIsOpen(false);
    setQuery('');
    onSelectDestination(
      preset.lat,
      preset.lng,
      preset.name,
      preset.subtitle,
      preset.heading
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      e.currentTarget.blur();
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      void handleSelectSuggestion(suggestions[0]);
      e.currentTarget.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[390px] space-y-2 pointer-events-auto"
    >
      {/* Brand Lockup + Global Search Row */}
      <div className="rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-2xl overflow-visible">
        <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
          <h1 className="font-display text-lg font-bold tracking-wider text-white whitespace-nowrap shrink-0">
            WORLD<span className="text-amber-400">//</span>DRIVE
          </h1>

          <button
            type="button"
            onClick={() => {
              setShowPresets((prev) => !prev);
              setIsOpen(false);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{activeLocation.name}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showPresets ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Worldwide City / Address Search Input */}
        <div className="relative flex items-center px-3 py-2">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setShowPresets(false);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search any city or address worldwide..."
            aria-label="Search any city or address worldwide"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {(isLoading || selecting || isTeleporting) && (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0 ml-2" />
          )}
          {query && !isLoading && !selecting && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                resetSession();
                setIsOpen(false);
              }}
              aria-label="Clear search"
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && query.trim().length > 0 && (
          <div className="border-t border-white/10 max-h-64 overflow-y-auto divide-y divide-white/5">
            {error && (
              <div className="px-3.5 py-2.5 text-xs text-red-400">{error}</div>
            )}
            {!isLoading && !error && suggestions.length === 0 && (
              <div className="px-3.5 py-3 text-xs text-zinc-400">
                No matching places found for &ldquo;{query}&rdquo;.
              </div>
            )}
            {suggestions.map((suggestion, idx) => {
              const prediction = suggestion.placePrediction;
              if (!prediction) return null;
              const mainText =
                prediction.mainText?.text ?? prediction.text.text;
              const secondaryText = prediction.secondaryText?.text ?? '';

              return (
                <button
                  key={prediction.placeId ?? idx}
                  type="button"
                  onClick={() => void handleSelectSuggestion(suggestion)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-white/10 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-100 truncate">
                      {mainText}
                    </div>
                    {secondaryText && (
                      <div className="text-xs text-zinc-400 truncate">
                        {secondaryText}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Global Destinations Dropdown */}
        {showPresets && (
          <div className="border-t border-white/10 p-1.5 grid grid-cols-1 gap-0.5">
            {WORLD_LANDMARKS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-white/10 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {preset.city} · {preset.country}
                  </div>
                </div>
                <span className="font-mono-tech text-[10px] text-zinc-500 shrink-0">
                  {preset.lat.toFixed(2)}, {preset.lng.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
