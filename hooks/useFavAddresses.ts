import { useLocalStorage } from '@rehooks/local-storage';
import { useCallback } from 'react';

type AddAddressFn = (address: string) => void;
type RemoveAddressFn = (address: string) => void;

export default function useFavAddresses(): [string[], AddAddressFn, RemoveAddressFn] {
  const [favAddresses, setFavAddresses] = useLocalStorage<Array<string>>('fav_addresses', []);

  const removeFav: RemoveAddressFn = useCallback(
    (addr: string) => {
      const idx = favAddresses.indexOf(addr);
      if (idx < 0) {
        return;
      }

      favAddresses.splice(idx, 1);
      setFavAddresses([...favAddresses]);
    },
    [favAddresses, setFavAddresses],
  );

  const addFav: AddAddressFn = useCallback(
    (addr: string) => {
      const idx = favAddresses.indexOf(addr);
      if (idx >= 0) {
        return;
      }

      favAddresses.push(addr);
      setFavAddresses([...favAddresses]);
    },
    [favAddresses, setFavAddresses],
  );

  return [favAddresses, addFav, removeFav];
}
