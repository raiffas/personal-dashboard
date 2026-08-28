import { useState } from "react";
import { APITester } from "./APITester";

import {Route, Switch } from "wouter";
import InboxPage from "./components/InboxPage";
import CalendarPage from "./components/CalendarPage";
import HomePage from "./components/HomePage";
import NavBar from "./components/NavBar";


export function App() {
  const [mode, setMode] = useState<"day" | "night">("day");
  const [queueDebugMode, setQueueDebugMode] = useState(false);

  return (
    <div data-mode={mode}>
      <NavBar
        mode={mode}
        onToggleMode={() => setMode(m => (m === "day" ? "night" : "day"))}
        queueDebugMode={queueDebugMode}
        onToggleQueueDebug={() => setQueueDebugMode((v) => !v)}
      />
      <Switch>
        <Route path="/">
          <HomePage mode={mode} />
        </Route>
        <Route path="/inbox">
          <InboxPage debugQueueMode={queueDebugMode} />
        </Route>
        <Route path="/calendar" component={CalendarPage} />
      </Switch>
    </div>

  );
}

export default App;
