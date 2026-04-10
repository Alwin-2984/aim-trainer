import { forwardRef } from 'react';

interface CrosshairProps {
  className?: string;
}

const Crosshair = forwardRef<HTMLDivElement, CrosshairProps>(function Crosshair({ className = '' }, ref) {
  return (
    <div id="crosshair" ref={ref} className={className}>
      <div className="ch-line ch-v ch-top"></div>
      <div className="ch-line ch-v ch-bottom"></div>
      <div className="ch-line ch-h ch-left"></div>
      <div className="ch-line ch-h ch-right"></div>
      <div className="ch-dot"></div>
    </div>
  );
});

export default Crosshair;
