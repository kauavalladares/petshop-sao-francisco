export default function LacoDivider({ className = '', color = '#1B5E63' }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-10 md:h-14"
      >
        <path
          d="M0 30 C 150 30, 180 6, 260 6 C 340 6, 360 42, 430 42 C 480 42, 495 18, 540 18 C 575 18, 585 34, 620 34 C 655 34, 665 18, 700 18 C 745 18, 760 42, 810 42 C 880 42, 900 6, 980 6 C 1060 6, 1090 30, 1200 30"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
