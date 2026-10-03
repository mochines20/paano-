import Image from "next/image";

interface BotAvatarProps {
  size?: number;
  className?: string;
  showPulse?: boolean;
}

/**
 * Avatar ng PAANO bot.
 * Default: the PAANO AI logo.
 * Kung gusto mo ibang image, palitan lang ang src.
 */
export function BotAvatar({
  size = 28,
  className = "",
  showPulse = false,
}: BotAvatarProps) {
  return (
    <span
      className={`relative inline-block overflow-hidden rounded-full border border-line-strong bg-[#0A3D5C] ${className}`}
      style={{ width: size, height: size }}
    >
      {showPulse && (
        <span
          className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full border border-deep bg-accent"
          aria-hidden
        />
      )}
      <Image
        src="/brand/paano-ai-logo.png"
        alt="PAANO bot"
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-contain p-0.5"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement("span");
            fallback.className =
              "flex h-full w-full items-center justify-center text-[10px] font-black text-[#FBE77A]";
            fallback.textContent = "P";
            parent.appendChild(fallback);
          }
        }}
      />
    </span>
  );
}
