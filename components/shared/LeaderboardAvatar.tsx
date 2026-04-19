"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function LeaderboardAvatar({ src, alt, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external avatars + onError fallback
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = "/icons/profile-placeholder.svg";
      }}
    />
  );
}
