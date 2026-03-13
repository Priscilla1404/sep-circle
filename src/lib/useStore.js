import { useState, useEffect } from 'react';
import { store } from './store';

export function useStore() {
  const [data, setData] = useState(store.getData());
  const [currentUser, setCurrentUser] = useState(store.getCurrentUser());

  useEffect(() => {
    const unsub = store.subscribe((newData) => {
      setData(newData);
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  return { data, currentUser, store };
}
