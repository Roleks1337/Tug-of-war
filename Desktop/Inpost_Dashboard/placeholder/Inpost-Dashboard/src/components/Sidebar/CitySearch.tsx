import { useState } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface CitySearchProps {
  onSearch: (city: string) => void;
  onClear: () => void;
  isLoading: boolean;
  searchedCity: string | null;
  autoLoadCity?: string | null;
  onFindNearest: () => void;
}

// Comprehensive list of Polish cities for autocomplete
const POLISH_CITIES: string[] = [
  'Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz',
  'Lublin', 'Białystok', 'Katowice', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec',
  'Toruń', 'Kielce', 'Rzeszów', 'Gliwice', 'Zabrze', 'Olsztyn', 'Bielsko-Biała',
  'Bytom', 'Zielona Góra', 'Rybnik', 'Ruda Śląska', 'Tychy', 'Opole', 'Elbląg',
  'Płock', 'Dąbrowa Górnicza', 'Wałbrzych', 'Włocławek', 'Tarnów', 'Chorzów',
  'Koszalin', 'Kalisz', 'Legnica', 'Grudziądz', 'Słupsk', 'Jaworzno', 'Jastrzębie-Zdrój',
  'Nowy Sącz', 'Jelenia Góra', 'Siedlce', 'Mysłowice', 'Konin', 'Piotrków Trybunalski',
  'Lubin', 'Inowrocław', 'Ostrowiec Świętokrzyski', 'Gniezno', 'Stargard', 'Świdnica',
  'Sanok', 'Ostrów Wielkopolski', 'Leszno', 'Piła', 'Pabianice', 'Suwałki',
  'Łódź', 'Radomsko', 'Zamość', 'Chełm', 'Przemyśl', 'Stalowa Wola', 'Mielec',
  'Tarnowskie Góry', 'Będzin', 'Siemianowice Śląskie', 'Żywiec', 'Oświęcim',
  'Sandomierz', 'Biłgoraj', 'Łuków', 'Puławy', 'Ostróda', 'Malbork', 'Lębork',
  'Świnoujście', 'Kołobrzeg', 'Nowy Targ', 'Zakopane', 'Ostrów Mazowiecka',
  'Wołomin', 'Legionowo', 'Piaseczno', 'Pruszków', 'Żyrardów', 'Otwock', 'Grodzisk Mazowiecki',
];

const SUGGESTED_CITIES = [
  'Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk',
  'Łódź', 'Katowice', 'Lublin', 'Szczecin', 'Bydgoszcz',
];

const DATALIST_ID = 'polish-cities-datalist';

export function CitySearch({
  onSearch,
  onClear,
  isLoading,
  searchedCity,
  autoLoadCity,
  onFindNearest,
}: CitySearchProps) {
  const [inputValue, setInputValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  }

  function handleSuggestion(city: string) {
    setInputValue(city);
    onSearch(city);
  }

  function handleClear() {
    setInputValue('');
    onClear();
  }

  return (
    <div className="space-y-3">
      {/* Datalist for browser-native autocomplete */}
      <datalist id={DATALIST_ID}>
        {POLISH_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            id="city-search-input"
            type="text"
            list={DATALIST_ID}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a city..."
            autoComplete="off"
            className={clsx(
              'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm',
              'bg-zinc-800/80 border border-zinc-700/60 text-zinc-100',
              'placeholder:text-zinc-500',
              'focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20',
              'transition-all duration-200',
            )}
          />
        </div>
        <button
          id="city-search-btn"
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className={clsx(
            'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
            'bg-yellow-400 text-zinc-900 hover:bg-yellow-300 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-400',
            'flex items-center gap-2',
          )}
        >
          {isLoading ? <LoadingSpinner size={16} /> : 'Search'}
        </button>
      </form>

      {/* Active search tag */}
      {searchedCity && !isLoading && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30">
            <MapPin size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">{searchedCity}</span>
          </div>
          <button
            onClick={handleClear}
            className="p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Auto-load indicator */}
      {autoLoadCity && autoLoadCity !== searchedCity && isLoading && (
        <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <MapPin size={10} className="text-yellow-500" />
          Detected: <span className="text-zinc-300 font-medium">{autoLoadCity}</span>
        </p>
      )}

      <div className="pt-2 border-t border-zinc-800/60 flex flex-col gap-2">
        <button
          onClick={onFindNearest}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 transition-colors text-yellow-400 border border-zinc-700/50"
        >
          <MapPin size={14} />
          Find nearest from my location
        </button>
        {/* Quick city chips */}
        {!searchedCity && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {SUGGESTED_CITIES.map((city) => (
              <button
                key={city}
              onClick={() => handleSuggestion(city)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
                'hover:bg-zinc-700/60 hover:text-zinc-200 hover:border-zinc-600/50',
                'active:scale-95',
              )}
            >
              {city}
            </button>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
