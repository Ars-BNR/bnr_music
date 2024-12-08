// import { ROUTES } from "@/shared/constants/routes";
// import { useRouter } from "next/navigation";
// import React, { PropsWithChildren, ReactElement } from "react";

// export function protectedPage<P>(Component: (props: P) => ReactElement) {
//   return function ProtectedPage(props: PropsWithChildren<P>) {
//     const router = useRouter();

//     const isLoading = true;
//     const isError = false;

//     if (isLoading) {
//       return <>LOading</>;
//     }
//     if (isError) {
//       router.replace(ROUTES.LOGIN);
//     }

//     return <Component {...props} />;
//   };
// }
