import type { SVGProps } from "react";

export function FleurDeLis(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M32 3c-7.8 8.5-10.2 18.8-6.8 28.3l-5.7-5.7C15.8 22 10.7 20.1 5 20.1c.3 10 4.9 18.1 14.2 22.2l7.1 3.1-2.5 8.1H15v4h34v-4h-8.8l-2.5-8.1 7.1-3.1C54.1 38.2 58.7 30.1 59 20.1c-5.7 0-10.8 1.9-14.5 5.5l-5.7 5.7C42.2 21.8 39.8 11.5 32 3Zm0 13c3.1 6.1 2.7 12.8 0 18.8-2.7-6-3.1-12.7 0-18.8ZM17.2 29.3l9.5 9.5-6.1-2.7c-4.4-2-7.1-5.7-8.5-10.7 1.8.7 3.5 1.9 5.1 3.4Zm29.6 0c1.6-1.5 3.3-2.7 5.1-3.4-1.4 5-4.1 8.7-8.5 10.7l-6.1 2.7 9.5-9.5Z"
      />
      <path fill="currentColor" d="M27.4 42.7h9.2l2.5 8.1h-14l2.3-8.1Z" />
    </svg>
  );
}
