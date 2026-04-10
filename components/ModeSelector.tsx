import Link from 'next/link';

export default function ModeSelector() {
  return (
    <div className="mode-selector">
      <h3>Select Training Mode</h3>
      <div className="mode-cards">
        <Link href="/flick" className="mode-card">
          <div className="mode-icon">{'\u{1F3AF}'}</div>
          <h4>Micro-Flick</h4>
          <p>Static target clicking for precision training</p>
          <div className="mode-stats">
            <span>5 Targets</span>
            <span>60s</span>
          </div>
        </Link>

        <Link href="/tracking" className="mode-card">
          <div className="mode-icon">{'\u{1F4CD}'}</div>
          <h4>Smooth Tracking</h4>
          <p>Moving target tracking for consistency</p>
          <div className="mode-stats">
            <span>1 Target</span>
            <span>60s</span>
          </div>
        </Link>

        <Link href="/micro-adjustment" className="mode-card">
          <div className="mode-icon">{'\u{1F52C}'}</div>
          <h4>Micro Adjustment</h4>
          <p>Small, slow target in a tight zone — pure precision</p>
          <div className="mode-stats">
            <span>1 Target</span>
            <span>60s</span>
          </div>
        </Link>

        <Link href="/reaction" className="mode-card">
          <div className="mode-icon">{'\u{26A1}'}</div>
          <h4>Reaction Time</h4>
          <p>Test your reaction speed — Human Benchmark style</p>
          <div className="mode-stats">
            <span>Custom Trials</span>
            <span>Summary</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
