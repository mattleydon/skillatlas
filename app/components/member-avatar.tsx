"use client";

import Image from "next/image";
import { useState } from "react";

export default function MemberAvatar({ src, initials }: { src: string | null; initials: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) return <>{initials}</>;
  return <Image src={src} alt="" width={512} height={512} unoptimized
    className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />;
}
