import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import sun from "../assets/sun_transparent.png";
import moon from "../assets/moon-transparent.png";

// Casts the per-letter arch values to CSS custom properties so the actual
// transform formula lives once, in .arched-letter (master.css), instead of
// being duplicated in JSX for both "good" and "morning!"/"night!".
const archStyle = (rotation: number, lift: number): CSSProperties =>
  ({ "--rotation": rotation, "--lift": lift }) as CSSProperties;

// Both headline words use the same per-letter arch technique: each letter
// rotates and lifts a little based on how far it sits from the center of
// the word, tapering to nothing at both ends. "good" uses a stronger curve
// than "morning!" to read as wrapping the sun's edge.
const makeArchedLetters = (text: string, maxRotation: number, maxLift: number) =>
  text.split("").map((char, i, letters) => {
    const mid = (letters.length - 1) / 2;
    const t = (i - mid) / mid; // -1 at the first letter, 0 at center, 1 at the last letter
    return {
      char,
      rotation: t * maxRotation,
      lift: (1 - t * t) * maxLift, // parabola — peaks at the center letter
    };
  });

const GOOD_TEXT = "good";
const GOOD_CURVE_MAX_ROTATION = 5; // degrees the outermost letters tilt (0 = flat)
const GOOD_CURVE_MAX_LIFT = 0.3; // em the center letters rise above the outer ones (0 = flat)
const goodLetters = makeArchedLetters(GOOD_TEXT, GOOD_CURVE_MAX_ROTATION, GOOD_CURVE_MAX_LIFT);

const MORNING_TEXT = "morning!";
const NIGHT_TEXT = "night!";
const MORNING_CURVE_MAX_ROTATION = 4; // degrees the outermost letters tilt (0 = flat)
const MORNING_CURVE_MAX_LIFT = 0.12; // em the center letters rise above the outer ones (0 = flat)

type HomePageProps = {
  mode: "day" | "night";
};

const HomePage = ({ mode }: HomePageProps) => {
  const secondWordText = mode === "night" ? NIGHT_TEXT : MORNING_TEXT;
  const orbSrc = mode === "night" ? moon : sun;
  const morningLetters = makeArchedLetters(secondWordText, MORNING_CURVE_MAX_ROTATION, MORNING_CURVE_MAX_LIFT);

  const orbContainerRef = useRef<HTMLDivElement>(null);
  const goodRef = useRef<HTMLSpanElement>(null);
  const morningRef = useRef<HTMLSpanElement>(null);
  // Extra pixel nudge (on top of each word's existing tilt/overlap transform)
  // that re-centers it over the orb. The tilt/overlap offsets in master.css
  // are percentages of each word's own rendered width, which varies with
  // text length and font size — that drifts at different orb sizes, so it
  // can't be gotten right with CSS percentages alone. Instead we measure
  // where each word actually lands post-transform and correct with a
  // measured pixel delta, keeping the hand-lettered look intact everywhere.
  const [xOffsets, setXOffsets] = useState({ good: 0, morning: 0 });

  useLayoutEffect(() => {
    function recenter() {
      const container = orbContainerRef.current;
      const good = goodRef.current;
      const morning = morningRef.current;
      if (!container || !good || !morning) return;

      // Clear any previous correction and force a reflow before measuring,
      // so each recompute starts from the words' natural (untranslated)
      // position instead of compounding on the last correction.
      good.style.setProperty("--good-x-offset", "0px");
      morning.style.setProperty("--morning-x-offset", "0px");

      const containerCenter = container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2;
      const goodRect = good.getBoundingClientRect();
      const morningRect = morning.getBoundingClientRect();

      setXOffsets({
        good: containerCenter - (goodRect.left + goodRect.width / 2),
        morning: containerCenter - (morningRect.left + morningRect.width / 2),
      });
    }

    recenter();
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, [mode]);

  const dateText = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toLowerCase()
    .replace(/,/g, "");

  return (
    <div className="home-page">
      <div
        className="orb-container"
        ref={orbContainerRef}
        role="heading"
        aria-level={1}
        aria-label={`good ${secondWordText}`}
      >
        <img src={orbSrc} alt="" className="orb" />
        <div className="headline-group">
          <span
            className="good-headline"
            aria-hidden="true"
            ref={goodRef}
            style={{ "--good-x-offset": `${xOffsets.good}px` } as CSSProperties}
          >
            {goodLetters.map(({ char, rotation, lift }, i) => (
              <span key={i} className="arched-letter" style={archStyle(rotation, lift)}>
                {char}
              </span>
            ))}
          </span>
          <span
            className="morning-headline"
            aria-hidden="true"
            ref={morningRef}
            style={{ "--morning-x-offset": `${xOffsets.morning}px` } as CSSProperties}
          >
            {morningLetters.map(({ char, rotation, lift }, i) => (
              <span key={i} className="arched-letter" style={archStyle(rotation, lift)}>
                {char}
              </span>
            ))}
          </span>
          <span className="handwritten-accent">write your checkin!</span>
        </div>
      </div>

      {/* <div className="side-arrows">
        <Link to="/inbox">
          <button className="arrow-button left">
            <span className="arrow-label">inbox</span>
          </button>
        </Link>
        <Link to="/calendar">
          <button className="arrow-button right">
            <span className="arrow-label">calendar</span>
          </button>
        </Link>
      </div> */}

      <div className="date-stamp">{dateText}</div>
    </div>
  );
};

export default HomePage;
