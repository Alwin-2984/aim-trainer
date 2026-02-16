interface CrosshairProps {
  className?: string;
}

export default function Crosshair({ className = '' }: CrosshairProps) {
  return (
    <div id="crosshair" className={className}>
      <div className="ch-line ch-v ch-top"></div>
      <div className="ch-line ch-v ch-bottom"></div>
      <div className="ch-line ch-h ch-left"></div>
      <div className="ch-line ch-h ch-right"></div>
      <div className="ch-dot"></div>
    </div>
  );
}
