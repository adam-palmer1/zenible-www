import { useState, useEffect } from 'react';
import { ZBI_API_BASE_URL } from '../../../config/api';

export interface LandingAICharacter {
  id: string;
  name: string;
  internal_name: string;
  description: string | null;
  avatar_url: string | null;
}

export function useAICharacters() {
  const [characters, setCharacters] = useState<LandingAICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCharacters() {
      try {
        const res = await fetch(`${ZBI_API_BASE_URL}/ai/characters?per_page=50`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;

        const list: LandingAICharacter[] = (data.items || data.data?.items || data.data || [])
          .filter((c: LandingAICharacter) => c.description);
        setCharacters(list);
      } catch {
        if (!cancelled) {
          setError('Failed to load AI advisors');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCharacters();
    return () => { cancelled = true; };
  }, []);

  return { characters, loading, error };
}
