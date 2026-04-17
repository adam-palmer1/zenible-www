import { useState, useEffect } from 'react';
import { publicChatApi, type PublicCharacter } from '../services/publicChatApi';

export function usePublicCharacters() {
  const [characters, setCharacters] = useState<PublicCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    publicChatApi.getCharacters().then((chars) => {
      if (!cancelled) {
        setCharacters(chars);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { characters, loading };
}
