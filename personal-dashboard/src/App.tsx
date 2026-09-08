import { useEffect, useState } from "react";
import { APITester } from "./APITester";

import {Route, Switch } from "wouter";
import InboxPage from "./components/InboxPage";
import CalendarPage from "./components/CalendarPage";
import HomePage from "./components/HomePage";
import NavBar from "./components/NavBar";

// Day mode runs 3am-5pm, night mode runs 5pm-2:59am.
function getModeForTime(date: Date): "day" | "night" {
  const hour = date.getHours();
  return hour >= 3 && hour < 17 ? "day" : "night";
}

// Finds the next 3am or 5pm boundary after `date`, whichever comes first.
function getNextBoundary(date: Date): Date {
  const candidates = [3, 17].map((hour) => {
    const boundary = new Date(date);
    boundary.setHours(hour, 0, 0, 0);
    if (boundary <= date) boundary.setDate(boundary.getDate() + 1);
    return boundary;
  });
  return candidates[0] < candidates[1] ? candidates[0] : candidates[1];
}

export function App() {
  const [mode, setMode] = useState<"day" | "night">(() => getModeForTime(new Date()));

  // Re-computes mode exactly at each 3am/5pm boundary so a long-lived tab
  // switches automatically without polling every minute.
  useEffect(() => {
    const timer = setTimeout(() => {
      setMode(getModeForTime(new Date()));
    }, getNextBoundary(new Date()).getTime() - Date.now());
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <div data-mode={mode}>
      <NavBar mode={mode} />
      <Switch>
        <Route path="/">
          <HomePage mode={mode} />
        </Route>
        <Route path="/inbox">
          <InboxPage />
        </Route>
        <Route path="/calendar" component={CalendarPage} />
      </Switch>
    </div>

  );
}

export default App;
