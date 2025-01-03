export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  } as T;
}
