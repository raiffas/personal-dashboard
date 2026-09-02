import type { CSSProperties } from "react";
import { Link } from "wouter";
import sun from "../assets/sun_transparent.png";

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
  const morningLetters = makeArchedLetters(secondWordText, MORNING_CURVE_MAX_ROTATION, MORNING_CURVE_MAX_LIFT);

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
      <div className="orb-container" role="heading" aria-level={1} aria-label={`good ${secondWordText}`}>
        <img src={sun} alt="" className="orb" />
        <div className="headline-group">
          <span className="good-headline" aria-hidden="true">
            {goodLetters.map(({ char, rotation, lift }, i) => (
              <span key={i} className="arched-letter" style={archStyle(rotation, lift)}>
                {char}
              </span>
            ))}
          </span>
          <span className="morning-headline" aria-hidden="true">
            {morningLetters.map(({ char, rotation, lift }, i) => (
              <span key={i} className="arched-letter" style={archStyle(rotation, lift)}>
                {char}
              </span>
            ))}
          </span>
          <span className="handwritten-accent">write your checkin!</span>
        </div>
      </div>

      <div className="side-arrows">
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
      </div>

      <div className="date-stamp">{dateText}</div>
    </div>
  );
};

export default HomePage;
