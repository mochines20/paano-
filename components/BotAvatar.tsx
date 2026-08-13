import Image from "next/image";

interface BotAvatarProps {
  size?: number;
  className?: string;
  showPulse?: boolean;
}

/**
 * Avatar ng PAANO bot.
 * Default: /public/bot-avatar.svg (pixelated AI bot).
 * Kung gusto mo ibang image, palitan lang ang src.
 */
export function BotAvatar({
  size = 28,
  className = "",
  showPulse = false,
}: BotAvatarProps) {
  return (
    <span
      className={`relative inline-block overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 ${className}`}
      style={{ width: size, height: size }}
    >
      {showPulse && (
        <span
          className="animate-pulse-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-zinc-950 bg-orange-500"
          aria-hidden
        />
      )}
      <Image
        src="/bot-avatar.svg"
        alt="PAANO bot"
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement("span");
            fallback.className =
              "flex h-full w-full items-center justify-center text-[10px] font-black text-orange-500";
            fallback.textContent = "P";
            parent.appendChild(fallback);
          }
        }}
      />
    </span>
  );
}
