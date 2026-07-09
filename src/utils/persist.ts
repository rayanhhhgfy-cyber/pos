export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { usage: 0, quota: 0 };
  }
  const est = await navigator.storage.estimate();
  return {
    usage: est.usage ?? 0,
    quota: est.quota ?? 0,
  };
}