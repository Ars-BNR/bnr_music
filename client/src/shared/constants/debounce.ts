export type DebouncedFunction<TArgs extends unknown[]> = ((
  ...args: TArgs
) => void) & { cancel: () => void };

export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number,
): DebouncedFunction<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: TArgs) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
  return debounced;
}
